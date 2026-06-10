const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

//PARCHE DE COMPATIBILIDAD ORACLE
try {
    oracledb.initOracleClient();
    console.log("Oracle Instant Client inicializado correctamente.");
} catch (err) {
    console.error("Error al inicializar el cliente de Oracle:", err);
}

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    user: 'AgendApp',
    password: 'AgendApp',
    connectString: 'localhost:1521/xe'
};

//ENDPOINTS EXISTENTES

//VALIDA EL RUN DEL PACIENTE EN EL REGISTRO
app.get('/api/validar-run/:run', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const runRecibido = req.params.run;

        // SQL limpio normalizando tanto la columna de la DB como el parámetro recibido
        const sql = `
            SELECT RUN_PAC
            FROM PACIENTE
            WHERE REPLACE(REPLACE(UPPER(RUN_PAC), '.', ''), '-', '') = REPLACE(REPLACE(UPPER(:run), '.', ''), '-', '')
        `;

        const result = await connection.execute(
            sql,
            { run: runRecibido },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.json({
            existe: result.rows.length > 0
        });

    } catch (err) {
        console.error("Error validar RUN:", err);
        return res.status(500).json({
            existe: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Error al cerrar conexión:", e);
            }
        }
    }
});

//VALIDA EL REGISTRO DEL PACIENTE SI SU RUN NO SE ENCUENTRA EN EL SISTEMA NO PUEDE REGISTRARSE
app.get('/api/validar-paciente/:run', async (req, res) => {
    const { run } = req.params;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT NOMB_PAC, APELL_PAT_PAC, ESTADO_ID_ESTADO FROM PACIENTE WHERE RUN_PAC = :run`;
        const result = await connection.execute(sql, [run], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        if (result.rows.length === 0) {
            return res.status(404).json({ valido: false, mensaje: "El RUN no figura en los registros del CESFAM." });
        }
        const paciente = result.rows[0];
        if (paciente.ESTADO_ID_ESTADO !== 1) {
            return res.status(403).json({ valido: false, mensaje: "El paciente se encuentra inactivo." });
        }
        res.json({ valido: true, nombre: `${paciente.NOMB_PAC} ${paciente.APELL_PAT_PAC}` });
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        if (connection) await connection.close();
    }
});

//
app.post('/api/vincular-paciente', async (req, res) => {
    const { email, run, firebaseUID } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `UPDATE PACIENTE SET EMAIL = :email, FIREBASE_UID = :firebaseUID, PASS = 'FIREBASE_MANAGED' WHERE RUN_PAC = :run`,
            { email, firebaseUID, run },
            { autoCommit: true }
        );
        if (result.rowsAffected > 0) {
            res.json({ success: true, mensaje: "Vinculado con éxito." });
        } else {
            res.status(404).json({ success: false, mensaje: "RUT no encontrado." });
        }
    } catch (err) {
        res.status(500).json({ error: "Error interno al vincular." });
    } finally {
        if (connection) await connection.close();
    }
});

//ENDPOINT OBTENER ROL
app.get('/api/obtener-rol/:uid', async (req, res) => {
    const { uid } = req.params;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        // 1. Buscar primero en PACIENTE
        let result = await connection.execute(
            `SELECT USUARIO_ID_TP_USER FROM PACIENTE WHERE FIREBASE_UID = :u`,
            [uid.trim()],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 2. Si no existe, buscar en SOME (PERS_SOME)
        if (!result.rows.length) {
            result = await connection.execute(
                `SELECT USUARIO_ID_TP_USER FROM PERS_SOME WHERE FIREBASE_UID = :u`,
                [uid.trim()],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        }

        // Validación de existencia
        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Determinar el rol según el ID de tipo de usuario
        const idTipo = result.rows[0].USUARIO_ID_TP_USER;
        let rol = 'DESCONOCIDO';

        switch (idTipo) {
            case 1:
                rol = 'SOME';
                break;
            case 2:
                rol = 'MEDICO';
                break;
            case 3:
                rol = 'PACIENTE';
                break;
        }

        return res.json({
            success: true,
            rol
        });

    } catch (err) {
        console.error('Error obtener rol:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error('Error al cerrar conexión en obtener-rol:', closeErr);
            }
        }
    }
});

// Endpoint para obtener el nombre completo del paciente logueado
app.get('/api/datos-paciente/:uid', async (req, res) => {
    const { uid } = req.params;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Consultamos el nombre y apellido del paciente correspondiente al UID
        const sql = `SELECT NOMB_PAC, APELL_PAT_PAC FROM PACIENTE WHERE FIREBASE_UID = :u`;
        const result = await connection.execute(sql, [uid.trim()], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length > 0) {
            const paciente = result.rows[0];
            const nombreCompleto = `${paciente.NOMB_PAC} ${paciente.APELL_PAT_PAC}`;
            
            res.json({ success: true, nombre: nombreCompleto });
        } else {
            res.status(404).json({ success: false, error: "Paciente no encontrado" });
        }
    } catch (err) {
        console.error("Error al obtener datos del paciente:", err.message);
        res.status(500).json({ success: false, error: "Error de base de datos" });
    } finally {
        if (connection) await connection.close();
    }
});

//Obtener el perfil completo del paciente (Nombre y RUN) para la pantalla de Perfil
app.get('/api/perfil-completo-paciente/:uid', async (req, res) => {
    const { uid } = req.params;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const sql = `SELECT NOMB_PAC, APELL_PAT_PAC, RUN_PAC FROM PACIENTE WHERE FIREBASE_UID = :u`;
        const result = await connection.execute(sql, [uid.trim()], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length > 0) {
            const pac = result.rows[0];
            res.json({ 
                success: true, 
                nombre: `${pac.NOMB_PAC} ${pac.APELL_PAT_PAC}`,
                run: pac.RUN_PAC
            });
        } else {
            res.status(404).json({ success: false, error: "Paciente no encontrado" });
        }
    } catch (err) {
        console.error("Error en perfil-completo:", err.message);
        res.status(500).json({ success: false, error: "Error de base de datos" });
    } finally {
        if (connection) await connection.close();
    }
});

//Actualizar el correo electrónico modificado en la tabla de Oracle
app.put('/api/actualizar-perfil-paciente', async (req, res) => {
    const { uid, nuevoEmail } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const sql = `UPDATE PACIENTE SET EMAIL = :email WHERE FIREBASE_UID = :u`;
        const result = await connection.execute(
            sql, 
            { email: nuevoEmail, u: uid.trim() }, 
            { autoCommit: true }
        );

        if (result.rowsAffected > 0) {
            console.log(`✏️ Email actualizado en Oracle para el UID: ${uid}`);
            res.json({ success: true, mensaje: "Base de datos sincronizada." });
        } else {
            res.status(404).json({ success: false, error: "No se encontró el registro para actualizar." });
        }
    } catch (err) {
        console.error("Error al actualizar perfil en Oracle:", err.message);
        res.status(500).json({ success: false, error: "Error interno de base de datos" });
    } finally {
        if (connection) await connection.close();
    }
});

//Endpoint para obtener disponibilidad filtrada por fecha (YYYY-MM-DD)
app.get('/api/disponibilidad-medica/:fecha/:servicio', async (req, res) => {
    const { fecha, servicio } = req.params;
    let connection;

    console.log(`Buscando agenda ${fecha} servicio ${servicio}`);

    try {
        connection = await oracledb.getConnection(dbConfig);

        // SQL limpio con exclusión optimizada mediante NOT EXISTS
        const sql = `
            SELECT
                A.ID_HORARIO,
                M.NOMB_MED || ' ' || M.APELL_PAT_MED AS NOMBRE_PROFESIONAL,
                TO_CHAR(A.FECHA_HORA,'HH24:MI') AS HORA_COMPLETA
            FROM AGEND_MED A
            INNER JOIN MEDICO M 
                ON REPLACE(REPLACE(A.MEDICO_RUN_MED, '.', ''), '-', '') = REPLACE(REPLACE(M.RUN_MED, '.', ''), '-', '')
            WHERE TRUNC(A.FECHA_HORA)
                = TO_DATE(:fecha,'YYYY-MM-DD')
            AND NOT EXISTS (
                SELECT 1
                FROM CITA_MEDICA C
                WHERE C.AGEND_MED_ID_HORARIO = A.ID_HORARIO
                AND C.BLOQ_PARC_CITA_ID_BLOQ IS NULL
            )
            ORDER BY NOMBRE_PROFESIONAL, HORA_COMPLETA
        `;

        const result = await connection.execute(
            sql,
            { 
                fecha, 
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Agrupamiento de bloques de horarios por médico
        const agrupado = {};
        result.rows.forEach(fila => {
            const nombre = fila.NOMBRE_PROFESIONAL;

            if (!agrupado[nombre]) {
                agrupado[nombre] = {
                    nombreMedico: `Dr. ${nombre}`,
                    horas: []
                };
            }

            agrupado[nombre].horas.push({
                hora: fila.HORA_COMPLETA,
                idHorario: fila.ID_HORARIO
            });
        });

        return res.json(Object.values(agrupado));

    } catch (err) {
        console.error("Oracle Error:", err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error al cerrar conexión:", closeErr);
            }
        }
    }
});

// 2. Buscamos qué boxes ya están ocupados en ese día y hora exacta
app.post('/api/registrar-cita', async (req, res) => {
    console.log("BODY RECIBIDO:", req.body);

    const { uidUsuario, idServicio, idHorario } = req.body;

    let connection;

    try {
        // VALIDACIONES INICIALES
        if (!uidUsuario) {
            return res.status(400).json(
                { success: false, error: "uidUsuario es obligatorio" }); 
            }
        
        if (isNaN(Number(idServicio))) {
            return res.status(400).json({
                success: false, 
                error: "Servicio inválido"
            });
        }

        if (isNaN(Number(idHorario))) {
            return res.status(400).json({
                success: false,
                error: "Horario inválido"
            });
        }
        connection = await oracledb.getConnection(dbConfig);

        // BUSCAR PACIENTE
        const pacienteResult = await connection.execute(
            ` 
            SELECT RUN_PAC 
            FROM PACIENTE 
            WHERE FIREBASE_UID = :firebaseUid 
            `,
            {
                firebaseUid: uidUsuario
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (pacienteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Paciente no encontrado"
            });
        }

        const runPaciente = pacienteResult.rows[0].RUN_PAC;

        // OBTENER HORARIO
        const horarioResult = await connection.execute(
            ` 
            SELECT ID_HORARIO, FECHA_HORA, MEDICO_RUN_MED 
            FROM AGEND_MED 
            WHERE ID_HORARIO = :idHorario `
            ,{
                idHorario: Number(idHorario)
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (horarioResult.rows.length === 0) {
            return res.status(404).json({
                success: false, 
                error: "Horario no encontrado"
            });
        }

        const horario = horarioResult.rows[0];

        // VALIDAR QUE NO SEA PASADO
        if (new Date(horario.FECHA_HORA) < new Date()) {
            return res.status(400).json({
                success: false, 
                error: "No se puede reservar una hora pasada"
            });
        }

        // VALIDAR SI YA ESTÁ TOMADO
        const citaHorario = await connection.execute(
            ` 
            SELECT ID_CITA 
            FROM CITA_MEDICA 
            WHERE AGEND_MED_ID_HORARIO = :idHorario `
            ,
            {
                idHorario: Number(idHorario)
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (citaHorario.rows.length > 0) {
            return res.status(400).json({
                success: false, 
                error: "Este horario ya fue reservado"
            });
        }

        // VALIDAR CITA FUTURA DEL PACIENTE
        const citaPaciente = await connection.execute(
            ` 
            SELECT C.ID_CITA 
            FROM CITA_MEDICA C 
                INNER JOIN AGEND_MED A 
                    ON A.ID_HORARIO = C.AGEND_MED_ID_HORARIO 
            WHERE C.PACIENTE_RUN_PAC = :runPaciente 
            AND A.FECHA_HORA >= SYSDATE `
            ,
            {
                runPaciente
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (citaPaciente.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Ya tienes una cita pendiente"
            });
        }

        // BUSCAR BOX DISPONIBLE
        const boxesResult = await connection.execute(
            ` 
            SELECT ID_BOX 
            FROM BOXES 
            ORDER BY ID_BOX `
            ,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        if (boxesResult.rows.length === 0) {
            return res.status(400).json({
                success: false, 
                error: "No existen boxes registrados"
            });
        }

        const boxAsignado = boxesResult.rows[0].ID_BOX;

        // OBTENER SIGUIENTE ID
        const idResult = await connection.execute(
            ` 
            SELECT NVL(MAX(ID_CITA),0)+1 AS NEXT_ID 
            FROM CITA_MEDICA 
            `
            ,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        const siguienteId = idResult.rows[0].NEXT_ID;

        // PREPARAR FECHA Y HORA
        const fechaStr = horario.FECHA_HORA .toISOString() .substring(0,10);
        const horaStr = horario.FECHA_HORA .toTimeString() .substring(0,5);

        // INSERTAR CITA
        await connection.execute(
            ` 
            INSERT INTO CITA_MEDICA (
                ID_CITA, 
                FECHA, 
                HORA, 
                PACIENTE_RUN_PAC, 
                CARTA_SERVICIO_ID_SERV, 
                AGEND_MED_ID_HORARIO, 
                BOXES_ID_BOX, 
                BLOQ_PARC_CITA_ID_BLOQ,
                ESTADO_CITA
            )
            VALUES (
                :idCita, 
                TO_DATE(:fecha,'YYYY-MM-DD'), 
                TO_DATE(:hora,'HH24:MI'), 
                :runPaciente, :idServicio, 
                :idHorario, 
                :boxAsignado, 
                NULL,
                'PENDIENTE'
            )
            `,
            {
                idCita: siguienteId, 
                fecha: fechaStr, 
                hora: horaStr, 
                runPaciente, 
                idServicio: Number(idServicio), 
                idHorario: Number(idHorario), 
                boxAsignado
            },
            {
                autoCommit: true
            }
        );

        return res.json({
            success: true, 
            message: `Cita registrada correctamente. Box ${boxAsignado} asignado`
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false, 
            error: err.message, 
            oracleCode: err.errorNum
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error(e);
            }
        }
    }
});

//
app.get('/api/mis-horas/:uid', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const uidFirebase = req.params.uid;

        // Consulta SQL estructurada con la integración de BOXES
        const sql = `
            SELECT
                C.ID_CITA,
                TO_CHAR(A.FECHA_HORA,'DD/MM/YYYY') AS FECHA,
                TO_CHAR(A.FECHA_HORA,'HH24:MI') AS HORA,
                TO_CHAR(A.FECHA_HORA,'YYYY-MM-DD"T"HH24:MI:SS') AS FECHA_HORA,
                M.NOMB_MED || ' ' ||M.APELL_PAT_MED AS NOMBRE_MEDICO,
                B.NUMB_BOX AS NUM_BOX,
                CS.NOMB_SERV AS SERVICIO
            FROM CITA_MEDICA C
            INNER JOIN PACIENTE P
                ON P.RUN_PAC =
                C.PACIENTE_RUN_PAC
            INNER JOIN AGEND_MED A
                ON A.ID_HORARIO =
                C.AGEND_MED_ID_HORARIO
            INNER JOIN MEDICO M
                ON REPLACE(REPLACE(A.MEDICO_RUN_MED,'.',''),'-','')
                =
                REPLACE(REPLACE(M.RUN_MED,'.',''),'-','')
            INNER JOIN BOXES B
                ON B.ID_BOX =
                C.BOXES_ID_BOX
            INNER JOIN CARTA_SERVICIO CS
                ON CS.ID_SERV =
                C.CARTA_SERVICIO_ID_SERV
            WHERE
                P.FIREBASE_UID =
                :uidFirebase
            AND
                C.BLOQ_PARC_CITA_ID_BLOQ IS NULL
            ORDER BY
                A.FECHA_HORA DESC
        `;
        console.log("UID recibido:", uidFirebase);

        const result = await connection.execute(
            sql,
            { uidFirebase },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log("Horas encontradas:", result.rows);
        return res.json(result.rows);

    } catch (err) {
        console.error("Error al obtener las horas médicas:", err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Error cerrando conexión:", e);
            }
        }
    }
});

//
app.post('/api/cancelar-cita', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const { idCita } = req.body;
        // Crear registro de bloqueo
        const bloque = await connection.execute(
            `
            INSERT INTO BLOQ_PARC_CITA
            (
                ID_BLOQ,
                MOTIVO_BLOQ
            )
            VALUES
            (
                SEQ_BLOQ_PARC_CITA.NEXTVAL,
                'Cancelación'
            )
            RETURNING ID_BLOQ INTO :id
            `,
            {
                id: {
                    dir: oracledb.BIND_OUT,
                    type: oracledb.NUMBER
                }
            },
            {
                autoCommit: false
            }
        );
        const idBloq =
            bloque.outBinds.id[0];
        // Marcar la cita como cancelada
        const resultado =
            await connection.execute(
                `
                UPDATE CITA_MEDICA
                SET BLOQ_PARC_CITA_ID_BLOQ =
                    :idBloq
                WHERE ID_CITA =
                    :idCita
                `,
                {
                    idBloq,
                    idCita
                }
            );
        if (resultado.rowsAffected === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        await connection.commit();
        return res.json({
            success: true,
            mensaje: 'Cita cancelada correctamente'
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }
        console.error(err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error(e);
            }
        }
    }
});

//
app.post('/api/confirmar-asistencia', async (req, res) => {
    let connection;
    try {
        const { idCita } = req.body;
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `
            UPDATE CITA_MEDICA
            SET ESTADO_CITA = 'CONFIRMADA'
            WHERE ID_CITA = :idCita
            `,
            {
                idCita
            },
            {
                autoCommit: true
            }
        );
        if(result.rowsAffected === 0){
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }
        return res.json({
            success: true,
            mensaje: 'Asistencia confirmada'
        });
    } catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }
});

//ENDPOINTS PARA SOME O ADMIN

//
app.get('/api/admin/:uid', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const { uid } = req.params;

        // Buscar datos esenciales del personal del SOME por su UID de Firebase
        const result = await connection.execute(
            `
            SELECT RUN_SOME, NOMB_SOME, APELL_PAT_SOME, EMAIL
            FROM PERS_SOME
            WHERE FIREBASE_UID = :uid
            `,
            { uid },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 1. Validar si el administrador existe
        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Administrador no encontrado'
            });
        }

        // 2. Retorno exitoso mapeando directamente la primera fila
        return res.json({
            success: true,
            admin: result.rows[0]
        });

    } catch (err) {
        console.error("❌ Error en obtener admin por UID:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error al cerrar conexión en obtener admin:", closeErr);
            }
        }
    }
});

//
app.get('/api/dashboard', async (req, res) => {
    let connection;
    try {
        connection =
            await oracledb.getConnection(dbConfig);
    
        // PACIENTES
        const pacientes =
            await connection.execute(
                `
                SELECT
                    COUNT(*) TOTAL,
                    SUM(
                        CASE
                            WHEN ESTADO_ID_ESTADO = 1
                            THEN 1
                            ELSE 0
                        END
                    ) ACTIVOS,
                    SUM(
                        CASE
                            WHEN ESTADO_ID_ESTADO = 2
                            THEN 1
                            ELSE 0
                        END
                    ) INACTIVOS
                FROM PACIENTE
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        // MEDICOS
        const medicos =
            await connection.execute(
                `
                SELECT
                    COUNT(*) TOTAL,
                    SUM(
                        CASE
                            WHEN ESTADO_ID_ESTADO = 1
                            THEN 1
                            ELSE 0
                        END
                    ) ACTIVOS,
                    SUM(
                        CASE
                            WHEN ESTADO_ID_ESTADO = 2
                            THEN 1
                            ELSE 0
                        END
                    ) INACTIVOS
                FROM MEDICO
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        // HORARIOS
        const horarios =
            await connection.execute(
                `
                SELECT
                    COUNT(*) TOTAL
                FROM AGEND_MED
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        // HORAS RESERVADAS
        const reservadas =
            await connection.execute(
                `
                SELECT
                    COUNT(*) TOTAL
                FROM CITA_MEDICA
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        const totalHorarios =
            horarios.rows[0].TOTAL;

        const totalReservadas =
            reservadas.rows[0].TOTAL;

        // DIAS MÁS AGENDADOS
        const diasMasAgendados =
            await connection.execute(
                `
                SELECT
                    TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH') DIA,
                    COUNT(*) TOTAL
                FROM CITA_MEDICA
                GROUP BY
                    TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH')
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );

        //
        const medicosMasSolicitados =
            await connection.execute(
                `
                SELECT
                    M.NOMB_MED || ' ' ||
                    M.APELL_PAT_MED || ' ' ||
                    M.APELL_MAT_MED
                    AS MEDICO,
                    COUNT(*) TOTAL
                FROM CITA_MEDICA C
                INNER JOIN AGEND_MED A
                    ON A.ID_HORARIO =
                    C.AGEND_MED_ID_HORARIO
                INNER JOIN MEDICO M
                    ON M.RUN_MED =
                    A.MEDICO_RUN_MED
                GROUP BY
                    M.NOMB_MED,
                    M.APELL_PAT_MED,
                    M.APELL_MAT_MED
                ORDER BY TOTAL DESC
                `,
                [],
                {
                outFormat:
                    oracledb.OUT_FORMAT_OBJECT
                }
            );

        //
        const serviciosMasSolicitados =
            await connection.execute(
                `
                SELECT
                    CS.NOMB_SERV,
                    COUNT(*) TOTAL
                FROM CITA_MEDICA C
                INNER JOIN CARTA_SERVICIO CS
                    ON CS.ID_SERV =
                    C.CARTA_SERVICIO_ID_SERV
                GROUP BY
                    CS.NOMB_SERV
                ORDER BY TOTAL DESC
                `,
                [],
                {
                outFormat:
                    oracledb.OUT_FORMAT_OBJECT
                }
            );

        res.json({
            pacientes:pacientes.rows[0],

            medicos:medicos.rows[0],

            horarios: {
                TOTAL:totalHorarios,

                DISPONIBLES:totalHorarios -totalReservadas,

                RESERVADAS:totalReservadas
            },

            diasMasAgendados: diasMasAgendados.rows,

            medicosMasSolicitados: medicosMasSolicitados.rows,

            serviciosMasSolicitados:serviciosMasSolicitados.rows

        });
    } catch(error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection) {
            await connection.close();
        }
    }
});

//
app.get('/api/medicos', async (req, res) => {

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `
            SELECT
                M.RUN_MED,
                M.NOMB_MED || ' ' ||
                M.APELL_PAT_MED || ' ' ||
                M.APELL_MAT_MED AS NOMBRE_COMPLETO,
                M.FECH_NAC,
                M.SEXO,
                E.ESTADO,
                P.PROFESION
            FROM MEDICO M
            INNER JOIN ESTADO E
                ON E.ID_ESTADO = M.ESTADO_ID_ESTADO
            INNER JOIN PROFESION P
                ON P.ID_PRO = M.PROFESION_ID_PRO
            ORDER BY M.NOMB_MED
            `,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }

});

//
app.post('/api/medicos', async (req, res) => {

    const {
        run,
        nombre,
        apellidoPat,
        apellidoMat,
        profesion,
        fechaNacimiento,
        sexo
    } = req.body;

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `
            INSERT INTO MEDICO
            (
                RUN_MED,
                NOMB_MED,
                APELL_PAT_MED,
                APELL_MAT_MED,
                PROFESION_ID_PRO,
                FECH_NAC,
                SEXO,
                ESTADO_ID_ESTADO
            )
            VALUES
            (
                :run,
                :nombre,
                :apellidoPat,
                :apellidoMat,
                :profesion,
                TO_DATE(:fechaNacimiento,'YYYY-MM-DD'),
                :sexo,
                2
            )
            `,
            {
                run,
                nombre,
                apellidoPat,
                apellidoMat,
                profesion,
                fechaNacimiento,
                sexo
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }
});

//
app.post('/api/horarios/generar', async (req, res) => {
    const {
        medico,
        fecha,
        horaInicio,
        horaFin,
        duracion
    } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        // VALIDAR QUE EL MÉDICO ESTÉ ACTIVO
        const validarMedico = await connection.execute(
            `
            SELECT ESTADO_ID_ESTADO
            FROM MEDICO
            WHERE RUN_MED = :medico
            `,
            {
                medico
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );
        if (
            validarMedico.rows.length === 0 ||
            validarMedico.rows[0].ESTADO_ID_ESTADO !== 1
        ) {
            return res.status(400).json({
                success: false,
                mensaje: 'El profesional se encuentra inactivo'
            });
        }
        const inicio = new Date(`${fecha}T${horaInicio}`);
        const fin = new Date(`${fecha}T${horaFin}`);
        let horariosGenerados = 0;
        while (inicio < fin) {
            const fechaHora = new Date(inicio);
            const existe = await connection.execute(
                `
                SELECT ID_HORARIO
                FROM AGEND_MED
                WHERE MEDICO_RUN_MED = :medico
                AND FECHA_HORA =
                    TO_DATE(
                        :fechaHora,
                        'YYYY-MM-DD HH24:MI'
                    )
                `,
                {
                    medico,
                    fechaHora:
                        fechaHora.getFullYear()
                        + '-'
                        + String(fechaHora.getMonth() + 1).padStart(2, '0')
                        + '-'
                        + String(fechaHora.getDate()).padStart(2, '0')
                        + ' '
                        + String(fechaHora.getHours()).padStart(2, '0')
                        + ':'
                        + String(fechaHora.getMinutes()).padStart(2, '0')
                },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
            if (existe.rows.length === 0) {
                await connection.execute(
                    `
                    INSERT INTO AGEND_MED
                    (
                        FECHA_HORA,
                        MEDICO_RUN_MED
                    )
                    VALUES
                    (
                        TO_DATE(
                            :fechaHora,
                            'YYYY-MM-DD HH24:MI'
                        ),
                        :medico
                    )
                    `,
                    {
                        fechaHora:
                            fechaHora.getFullYear()
                            + '-'
                            + String(fechaHora.getMonth() + 1).padStart(2, '0')
                            + '-'
                            + String(fechaHora.getDate()).padStart(2, '0')
                            + ' '
                            + String(fechaHora.getHours()).padStart(2, '0')
                            + ':'
                            + String(fechaHora.getMinutes()).padStart(2, '0'),
                        medico
                    }
                );
                horariosGenerados++;
            }
            inicio.setMinutes(
                inicio.getMinutes() + Number(duracion)
            );
        }
        await connection.commit();
        res.json({
            success: true,
            horariosGenerados
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

//
app.put('/api/medicos/estado/:run', async (req, res) => {
    const { run } = req.params;
    const { estado } = req.body;

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        await connection.execute(
            `
            UPDATE MEDICO
            SET ESTADO_ID_ESTADO = :estado
            WHERE RUN_MED = :run
            `,
            {
                estado,
                run
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }
});

//
app.get('/api/pacientes', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `
            SELECT
                P.RUN_PAC,
                P.NOMB_PAC || ' ' ||
                P.APELL_PAT_PAC || ' ' ||
                P.APELL_MAT_PAC AS NOMBRE_COMPLETO,
                p.EMAIL,
                P.FECH_NAC,
                P.FONO_PAC,
                P.SEXO,
                P.DIRECC,
                E.ESTADO
            FROM PACIENTE P
            INNER JOIN ESTADO E
                ON E.ID_ESTADO = P.ESTADO_ID_ESTADO
            ORDER BY P.NOMB_PAC
            `,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );
        res.json(result.rows);
    } catch(error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }
});

//
app.post('/api/pacientes', async (req, res) => {
    const {
        run,
        nombre,
        apellidoPat,
        apellidoMat,
        fechaNacimiento,
        telefono,
        direccion,
        sexo
    } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log(req.body);
        console.log(typeof fechaNacimiento);
        console.log(fechaNacimiento);
        console.log(new Date(fechaNacimiento));
        await connection.execute(
            `
            INSERT INTO PACIENTE
            (
                RUN_PAC,
                NOMB_PAC,
                APELL_PAT_PAC,
                APELL_MAT_PAC,
                FECH_NAC,
                FONO_PAC,
                DIRECC,
                SEXO,
                USUARIO_ID_TP_USER,
                ESTADO_ID_ESTADO
            )
            VALUES
            (
                :run,
                :nombre,
                :apellidoPat,
                :apellidoMat,
                :fechaNacimiento,
                :telefono,
                :direccion,
                :sexo,
                3,
                2
            )
            `,
            {
                run,
                nombre,
                apellidoPat,
                apellidoMat,
                fechaNacimiento: new Date(fechaNacimiento),
                telefono,
                direccion,
                sexo
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch(error) {
        console.log('DATOS RECIBIDOS:', req.body);
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection){
            await connection.close();
        }
    }
});

//
app.put('/api/pacientes/estado/:run', async (req, res) => {
    const { run } = req.params;
    const { estado } = req.body;

    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `
            UPDATE PACIENTE
            SET ESTADO_ID_ESTADO = :estado
            WHERE RUN_PAC = :run
            `,
            {
                estado,
                run
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

//
app.get('/api/citas', async (req, res) => {
let connection;
try {
    connection =
    await oracledb.getConnection(dbConfig);
    const result =
    await connection.execute(
        `
        SELECT
            C.ID_CITA,
            C.FECHA,
            C.HORA,
            C.ESTADO_CITA,
            P.RUN_PAC,
            P.NOMB_PAC || ' ' || P.APELL_PAT_PAC || ' ' || P.APELL_MAT_PAC AS NOMBRE_PACIENTE,
            M.RUN_MED,
            M.NOMB_MED || ' ' || M.APELL_PAT_MED || ' ' || M.APELL_MAT_MED AS NOMBRE_MEDICO,
            CS.NOMB_SERV AS SERVICIO,
            B.NUMB_BOX AS BOX,
            B.PISO
        FROM CITA_MEDICA C
        INNER JOIN PACIENTE P
            ON P.RUN_PAC = C.PACIENTE_RUN_PAC
        INNER JOIN AGEND_MED A 
            ON A.ID_HORARIO = C.AGEND_MED_ID_HORARIO
        INNER JOIN MEDICO M
            ON M.RUN_MED = A.MEDICO_RUN_MED
        INNER JOIN CARTA_SERVICIO CS
            ON CS.ID_SERV = C.CARTA_SERVICIO_ID_SERV
        INNER JOIN BOXES B
            ON B.ID_BOX = C.BOXES_ID_BOX
        ORDER BY
            C.FECHA DESC,
            C.HORA DESC
        `,
        [],
        {
        outFormat:
            oracledb.OUT_FORMAT_OBJECT
        }
    );
    res.json(
    result.rows
    );
} catch(error) {
    console.error(error);
    res.status(500).json(error);
} finally {
    if(connection) {
    await connection.close();
    }
}
});

//
app.get('/api/citas/buscar', async (req, res) => {
    const {
        runPaciente,
        runMedico,
        fecha
    } = req.query;
    let connection;
    try {
        connection =
            await oracledb.getConnection(
                dbConfig
            );
        let sql = `
            SELECT
                C.ID_CITA,
                P.RUN_PAC,
                M.RUN_MED,
                P.NOMB_PAC || ' ' ||
                P.APELL_PAT_PAC AS PACIENTE,
                M.NOMB_MED || ' ' ||
                M.APELL_PAT_MED AS MEDICO,
                TO_CHAR(
                    C.FECHA,
                    'YYYY-MM-DD'
                ) AS FECHA,
                TO_CHAR(
                    C.HORA,
                    'HH24:MI'
                ) AS HORA,
                B.NUMB_BOX,
                C.ESTADO_CITA
            FROM CITA_MEDICA C
            INNER JOIN PACIENTE P
                ON P.RUN_PAC =
                C.PACIENTE_RUN_PAC
            INNER JOIN AGEND_MED A
                ON A.ID_HORARIO =
                C.AGEND_MED_ID_HORARIO
            INNER JOIN MEDICO M
                ON REPLACE(
                    REPLACE(
                        M.RUN_MED,
                        '.',
                        ''
                    ),
                    '-',
                    ''
                )
                =
                REPLACE(
                    REPLACE(
                        A.MEDICO_RUN_MED,
                        '.',
                        ''
                    ),
                    '-',
                    ''
                )
            INNER JOIN BOXES B
                ON B.ID_BOX =
                C.BOXES_ID_BOX
            WHERE 1 = 1
        `;
        const binds = {};
        if (runPaciente) {
            sql += `
                AND UPPER(P.RUN_PAC)
                LIKE UPPER(:runPaciente)
            `;
            binds.runPaciente =
                `%${runPaciente}%`;
        }
        if (runMedico) {
            sql += `
                AND UPPER(M.RUN_MED)
                LIKE UPPER(:runMedico)
            `;
            binds.runMedico =
                `%${runMedico}%`;
        }
        if (fecha) {
            sql += `
                AND TRUNC(C.FECHA)
                =
                TO_DATE(
                    :fecha,
                    'YYYY-MM-DD'
                )
            `;
            binds.fecha = fecha;
        }
        sql += `
            ORDER BY
                C.FECHA DESC,
                C.HORA DESC
        `;
        const result =
            await connection.execute(
                sql,
                binds,
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        return res.json(
            result.rows
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            }
            catch (e) {
                console.error(e);
            }
        }
    }
});

//
app.put('/api/citas/estado', async (req, res) => {
    const {
        idCita,
        estado
    } = req.body;
    let connection;
    try {
        connection =
            await oracledb.getConnection(
                dbConfig
            );
        await connection.execute(
            `
            UPDATE CITA_MEDICA
            SET ESTADO_CITA = :estado
            WHERE ID_CITA = :idCita
            `,
            {
                estado,
                idCita
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if(connection) {
            await connection.close();
        }
    }
});

//
app.get('/api/citas/buscar', async (req, res) => {
const {
    runPaciente,
    runMedico,
    fecha
} = req.query;

let connection;

try {

    connection =
    await oracledb.getConnection(dbConfig);

    let sql = `
    SELECT
        C.ID_CITA,
        C.FECHA,
        C.HORA,
        P.RUN_PAC,
        P.NOMB_PAC || ' ' ||
        P.APELL_PAT_PAC || ' ' ||
        P.APELL_MAT_PAC
        AS NOMBRE_PACIENTE,
        M.RUN_MED,
        M.NOMB_MED || ' ' ||
        M.APELL_PAT_MED || ' ' ||
        M.APELL_MAT_MED
        AS NOMBRE_MEDICO,
        CS.NOMB_SERV AS SERVICIO,
        B.NUMB_BOX AS BOX,
        B.PISO
    FROM CITA_MEDICA C
    INNER JOIN PACIENTE P
        ON P.RUN_PAC = C.PACIENTE_RUN_PAC
    INNER JOIN AGEND_MED A
        ON A.ID_HORARIO = C.AGEND_MED_ID_HORARIO
    INNER JOIN MEDICO M
        ON M.RUN_MED = A.MEDICO_RUN_MED
    INNER JOIN CARTA_SERVICIO CS
        ON CS.ID_SERV = C.CARTA_SERVICIO_ID_SERV
    INNER JOIN BOXES B
        ON B.ID_BOX = C.BOXES_ID_BOX
    WHERE 1=1
    `;
    const binds = {};
    if (runPaciente) {
    sql += `
        AND P.RUN_PAC = :runPaciente
    `;
    binds.runPaciente = runPaciente;
    }
    if (runMedico) {
    sql += `
        AND M.RUN_MED = :runMedico
    `;
    binds.runMedico = runMedico;
    }
    if (fecha) {
    sql += `
        AND TRUNC(C.FECHA)
        = TO_DATE(:fecha,'YYYY-MM-DD')
    `;
    binds.fecha = fecha;
    }
    sql += `
    ORDER BY C.FECHA DESC
    `;
    const result =
    await connection.execute(
        sql,
        binds,
        {
        outFormat:oracledb.OUT_FORMAT_OBJECT
        }
    );
    res.json(result.rows);
} catch(error) {
    console.error(error);
    res.status(500).json(error);
} finally {
    if(connection)
    await connection.close();
}
});

//
app.get('/api/profesiones', async (req, res) => {
    let connection;
    try {
        connection =
            await oracledb.getConnection(dbConfig);
        const result =
            await connection.execute(
                `
                SELECT
                    ID_PRO,
                    PROFESION
                FROM PROFESION
                ORDER BY PROFESION
                `,
                [],
                {
                    outFormat:
                        oracledb.OUT_FORMAT_OBJECT
                }
            );
        res.json(result.rows);
    } catch(error) {
        console.error(error);
        res.status(500).json(error);
    } finally {
        if(connection)
            await connection.close();
    }
});

//
app.get('/api/some', async (req, res) => {
    let connection;
    try {
        connection =
        await oracledb.getConnection(dbConfig);
        const result =
        await connection.execute(
            `
            SELECT
                S.RUN_SOME,
                S.NOMB_SOME || ' ' || S.APELL_PAT_SOME || ' ' || S.APELL_MAT_SOME AS NOMBRE_COMPLETO,
                S.EMAIL,
                C.CARGO
            FROM PERS_SOME S
            INNER JOIN CARGO C
                ON C.ID_CARGO = S.CARGO_ID_CARGO
            ORDER BY
                NOMBRE_COMPLETO
            `,
            [],
            {
                outFormat:
                oracledb.OUT_FORMAT_OBJECT
            }
        );
        res.json(result.rows);
    } catch(error) {
        console.error(error);
        res.status(500).json(error);
    } finally {
        if(connection) {
            await connection.close();
        }
    }
});

//
app.post('/api/some', async (req, res) => {
    const {
        run,
        nombre,
        apellidoPat,
        apellidoMat,
        email,
        cargo
    } = req.body;
    let connection;
    try {
        connection =
        await oracledb.getConnection(dbConfig);
        await connection.execute(
            `
            INSERT INTO PERS_SOME
            (
                RUN_SOME,
                NOMB_SOME,
                APELL_PAT_SOME,
                APELL_MAT_SOME,
                EMAIL,
                PASS,
                USUARIO_ID_TP_USER,
                CARGO_ID_CARGO
            )
            VALUES
            (
                :run,
                :nombre,
                :apellidoPat,
                :apellidoMat,
                :email,
                'TEMPORAL',
                1,
                :cargo
            )
            `,
            {
                run,
                nombre,
                apellidoPat,
                apellidoMat,
                email,
                cargo
            },
            {
                autoCommit: true
            }
        );
        res.json({
            success: true
        });
    } catch(error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if(connection) {
            await connection.close();
        }
    }
});

//
app.get('/api/cargos', async (req, res) => {
    let connection;
    try {
        connection =
        await oracledb.getConnection(dbConfig);
        const result =
        await connection.execute(
            `
            SELECT
                ID_CARGO,
                CARGO
            FROM CARGO
            ORDER BY CARGO
            `,
            [],
            {
                outFormat:
                oracledb.OUT_FORMAT_OBJECT
            }
        );
        res.json(result.rows);
    } catch(error) {
        console.error(error);
        res.status(500).json(error);
    } finally {
        if(connection) {
            await connection.close();
        }
    }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));