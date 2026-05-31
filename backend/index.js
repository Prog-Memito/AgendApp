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
/* app.get('/api/disponibilidad-medica/:fecha', async (req, res) => {
    const { fecha } = req.params;
    let connection;

    console.log(`\n--- NUEVA SOLICITUD DE AGENDA PARA LA FECHA: ${fecha} ---`);

    try {
        connection = await oracledb.getConnection(dbConfig);

        // Consulta SQL estructurada y limpia
        const sql = `
            SELECT
                A.ID_HORARIO,
                M.NOMB_MED || ' ' || M.APELL_PAT_MED AS NOMBRE_PROFESIONAL,
                TO_CHAR(A.HORA_INI, 'HH24:MI') AS HORA_COMPLETA
            FROM AGEND_MED A
            INNER JOIN MEDICO M 
                ON REPLACE(REPLACE(A.MEDICO_RUN_MED, '.', ''), '-', '') = REPLACE(REPLACE(M.RUN_MED, '.', ''), '-', '')
            WHERE TRUNC(A.DIA_SEMANA) = TO_DATE(:f, 'YYYY-MM-DD')
            ORDER BY NOMBRE_PROFESIONAL, HORA_COMPLETA ASC
        `;

        const result = await connection.execute(
            sql,
            { f: fecha },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log(`Filas Oracle ${fecha}:`, result.rows);

        // Agrupación de horarios por médico
        const agrupado = {};
        result.rows.forEach(fila => {
            const nombre = fila.NOMBRE_PROFESIONAL;
            
            if (!agrupado[nombre]) {
                agrupado[nombre] = {
                    nombreMedico: nombre,
                    horas: []
                };
            }
            
            agrupado[nombre].horas.push({
                hora: fila.HORA_COMPLETA,
                idHorario: fila.ID_HORARIO
            });
        });

        const respuestaFinal = Object.values(agrupado);
        
        console.log("Estructura final enviada a Ionic:", JSON.stringify(respuestaFinal, null, 2));
        return res.json(respuestaFinal);

    } catch (err) {
        console.error("❌ Oracle:", err.message);
        return res.status(500).json({ error: `Error agenda: ${err.message}` });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Error cerrando conexión:", e);
            }
        }
    }
}); */
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
                TO_CHAR(A.HORA, 'HH24:MI') AS HORA_COMPLETA
            FROM AGEND_MED A
            INNER JOIN MEDICO M 
                ON REPLACE(REPLACE(A.MEDICO_RUN_MED, '.', ''), '-', '') = REPLACE(REPLACE(M.RUN_MED, '.', ''), '-', '')
            WHERE TRUNC(A.DIA) = TO_DATE(:fecha, 'YYYY-MM-DD')
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

    const { fecha, hora, uidUsuario, idServicio, idHorario } = req.body;
    let connection;

    try {
        // Validaciones iniciales
        if (!fecha || !hora || !uidUsuario) {
            return res.status(400).json({
                success: false,
                error: "Faltan datos obligatorios."
            });
        }

        if (isNaN(Number(idServicio))) {
            return res.status(400).json({
                success: false,
                error: `idServicio inválido: ${idServicio}`
            });
        }

        if (isNaN(Number(idHorario))) {
            return res.status(400).json({
                success: false,
                error: `idHorario inválido: ${idHorario}`
            });
        }

        connection = await oracledb.getConnection(dbConfig);

        // Buscar RUN paciente
        const sqlBuscarPac = `
            SELECT RUN_PAC
            FROM PACIENTE
            WHERE FIREBASE_UID = :uidFirebase
        `;

        const resPac = await connection.execute(
            sqlBuscarPac,
            { uidFirebase: uidUsuario },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resPac.rows.length) {
            return res.status(404).json({
                success: false,
                error: "Paciente no localizado en Oracle."
            });
        }

        const v_run = resPac.rows[0].RUN_PAC;

        // VALIDAR SI YA TIENE UNA CITA FUTURA
        const sqlValidarCitaExistente = `
            SELECT ID_CITA, TO_CHAR(HORA, 'DD/MM/YYYY HH24:MI') AS FECHA_HORA
            FROM CITA_MEDICA
            WHERE PACIENTE_RUN_PAC = :runPaciente
            AND HORA >= SYSDATE
        `;

        const resCitaExistente = await connection.execute(
            sqlValidarCitaExistente,
            { runPaciente: v_run },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (resCitaExistente.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Ya tienes una cita pendiente para ${resCitaExistente.rows[0].FECHA_HORA}`
            });
        }

        // Buscar boxes ocupados
        const sqlBoxesOcupados = `
            SELECT BOXES_ID_BOX
            FROM CITA_MEDICA
            WHERE FECHA = TO_DATE(:fechaBusqueda, 'YYYY-MM-DD')
            AND HORA = TO_DATE(:horaBusqueda, 'YYYY-MM-DD HH24:MI')
        `;

        console.log(`Verificando boxes para ${fecha} ${hora}`);

        const resBoxes = await connection.execute(
            sqlBoxesOcupados,
            {
                fechaBusqueda: fecha,
                horaBusqueda: `${fecha} ${hora}`
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const boxesOcupadosIds = resBoxes.rows.map(row => row.BOXES_ID_BOX);
        const boxesHabilitados = [1, 2, 3, 4, 5, 6, 7];
        const boxesLibres = boxesHabilitados.filter(box => !boxesOcupadosIds.includes(box));

        if (!boxesLibres.length) {
            return res.status(400).json({
                success: false,
                error: `No hay boxes disponibles para ${fecha} ${hora}`
            });
        }

        const boxAsignado = boxesLibres[0];

        // Obtener ID cita usando formato de arreglo nativo para outFormat por defecto
        const sqlNextId = `
            SELECT NVL(MAX(ID_CITA), 0) + 1 AS NEXT_ID
            FROM CITA_MEDICA
        `;

        const resId = await connection.execute(sqlNextId);
        const siguienteIdCita = resId.rows[0][0];

        // INSERT
        const sqlInsert = `
            INSERT INTO CITA_MEDICA (
                ID_CITA,
                FECHA,
                HORA,
                PACIENTE_RUN_PAC,
                CARTA_SERVICIO_ID_SERV,
                AGEND_MED_ID_HORARIO,
                BLOQ_PARC_CITA_ID_BLOQ,
                BOXES_ID_BOX
            ) VALUES (
                :idCita,
                TO_DATE(:fechaCita, 'YYYY-MM-DD'),
                TO_DATE(:fechaHoraCita, 'YYYY-MM-DD HH24:MI'),
                :runPaciente,
                :servicioId,
                :horarioId,
                :bloqueAgendaId,
                :boxId
            )
        `;

        const bindValues = {
            idCita: Number(siguienteIdCita),
            fechaCita: fecha,
            fechaHoraCita: `${fecha} ${hora}`,
            runPaciente: v_run,
            servicioId: Number(idServicio),
            horarioId: Number(idHorario),
            bloqueAgendaId: null,
            boxId: Number(boxAsignado)
        };

        console.log("SQL INSERT:", sqlInsert);
        console.log("BINDS:", bindValues);

        await connection.execute(sqlInsert, bindValues, { autoCommit: true });

        return res.json({
            success: true,
            message: `Cita registrada correctamente. Box ${boxAsignado} asignado.`
        });

    } catch (err) {
        console.error("ERROR ORACLE COMPLETO:", {
            message: err.message,
            errorNum: err.errorNum,
            offset: err.offset,
            stack: err.stack
        });

        return res.status(500).json({
            success: false,
            error: err.message,
            oracleCode: err.errorNum,
            offset: err.offset
        });
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

app.get('/api/mis-horas/:uid', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const uidFirebase = req.params.uid;

        // Consulta SQL estructurada con la integración de BOXES
        const sql = `
            SELECT
                C.ID_CITA,
                TO_CHAR(C.FECHA, 'DD/MM/YYYY') AS FECHA,
                TO_CHAR(C.HORA, 'HH24:MI') AS HORA,
                TO_CHAR(C.HORA, 'YYYY-MM-DD"T"HH24:MI:SS') AS FECHA_HORA,
                M.NOMB_MED || ' ' || M.APELL_PAT_MED AS NOMBRE_MEDICO,
                B.NUMB_BOX AS NUM_BOX,
                CS.NOMB_SERV AS SERVICIO
            FROM CITA_MEDICA C
            INNER JOIN PACIENTE P 
                ON P.RUN_PAC = C.PACIENTE_RUN_PAC
            INNER JOIN AGEND_MED A 
                ON A.ID_HORARIO = C.AGEND_MED_ID_HORARIO
            INNER JOIN MEDICO M 
                ON REPLACE(REPLACE(A.MEDICO_RUN_MED, '.', ''), '-', '') = REPLACE(REPLACE(M.RUN_MED, '.', ''), '-', '')
            INNER JOIN BOXES B 
                ON B.ID_BOX = C.BOXES_ID_BOX
            INNER JOIN CARTA_SERVICIO CS 
                ON CS.ID_SERV = C.CARTA_SERVICIO_ID_SERV
            INNER JOIN CARTA_SERVICIO CS
                ON CS.ID_SERV = C.CARTA_SERVICIO_ID_SERV
            WHERE P.FIREBASE_UID = :uidFirebase
            AND C.BLOQ_PARC_CITA_ID_BLOQ IS NULL
            ORDER BY C.FECHA DESC, C.HORA DESC
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

app.post('/api/cancelar-cita', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        const { idCita } = req.body;

        // 1. Crear registro de cancelación obteniendo el ID de la secuencia
        const bloque = await connection.execute(
            `
            INSERT INTO BLOQ_PARC_CITA (ID_BLOQ, MOTIVO_BLOQ)
            VALUES (SEQ_BLOQ_PARC_CITA.NEXTVAL, 'Cancelación')
            RETURNING ID_BLOQ INTO :id
            `,
            {
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }
        );

        const idBloq = bloque.outBinds.id[0];
        console.log("Bloqueo generado:", idBloq);

        // 2. Eliminar físicamente la cita médica
        const resultadoDelete = await connection.execute(
            `
            DELETE FROM CITA_MEDICA
            WHERE ID_CITA = :idCita
            `,
            { idCita }
        );

        console.log("Citas eliminadas:", resultadoDelete.rowsAffected);

        // 3. Confirmar la transacción atómica
        await connection.commit();

        return res.json({
            success: true,
            mensaje: 'Cita cancelada correctamente'
        });

    } catch (err) {
        // Ejecutar Rollback seguro en caso de cualquier falla interna
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Error al ejecutar rollback:", rollbackErr);
            }
        }

        console.error("❌ Error en cancelar-cita:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error cerrando conexión:", closeErr);
            }
        }
    }
});

app.post('/api/confirmar-asistencia', async (req, res) => {
    let connection;

    try {
        // En un futuro, aquí puedes agregar la lógica para actualizar el estado en Oracle si lo requieres
        return res.json({ success: true });
        
    } catch (err) {
        console.error("❌ Error en confirmar-asistencia:", err);
        return res.status(500).json({ error: err.message });
    }
});

//ENDPOINTS PARA SOME O ADMIN

// Mostrar Estadísticas clave para el SOME en un solo endpoint optimizado
app.get('/api/estadisticas-some', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        // Consulta unificada optimizada mediante subconsultas desde DUAL
        const sql = `
            SELECT
                (
                    SELECT COUNT(*) 
                    FROM CITA_MEDICA
                ) AS TOTAL_CITAS,
                (
                    SELECT NOMB_SERV 
                    FROM (
                        SELECT S.NOMB_SERV, COUNT(*) AS TOTAL
                        FROM CITA_MEDICA C
                        INNER JOIN CARTA_SERVICIO S ON C.CARTA_SERVICIO_ID_SERV = S.ID_SERV
                        GROUP BY S.NOMB_SERV
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS TIPO_MAS_AGENDADO,
                (
                    SELECT TOTAL 
                    FROM (
                        SELECT COUNT(*) AS TOTAL
                        FROM CITA_MEDICA
                        GROUP BY CARTA_SERVICIO_ID_SERV
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS CITAS_TIPO,
                (
                    SELECT DIA 
                    FROM (
                        SELECT
                            CASE
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'LUN%' THEN 'Lunes'
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'MAR%' THEN 'Martes'
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'MI%'  THEN 'Miércoles'
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'JUE%' THEN 'Jueves'
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'VIE%' THEN 'Viernes'
                                WHEN TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH') LIKE 'SÁB%' THEN 'Sábado'
                                ELSE 'Domingo'
                            END AS DIA,
                            COUNT(*) AS TOTAL
                        FROM CITA_MEDICA
                        GROUP BY TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH')
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS DIA_MAS_AGENDADO,
                (
                    SELECT TOTAL 
                    FROM (
                        SELECT COUNT(*) AS TOTAL
                        FROM CITA_MEDICA
                        GROUP BY TO_CHAR(FECHA, 'DY', 'NLS_DATE_LANGUAGE=SPANISH')
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS CITAS_DIA,
                (
                    SELECT NUMB_BOX 
                    FROM (
                        SELECT B.NUMB_BOX, COUNT(*) AS TOTAL
                        FROM CITA_MEDICA C
                        INNER JOIN BOXES B ON B.ID_BOX = C.BOXES_ID_BOX
                        GROUP BY B.NUMB_BOX
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS BOX_MAS_USADO,
                (
                    SELECT TOTAL 
                    FROM (
                        SELECT COUNT(*) AS TOTAL
                        FROM CITA_MEDICA
                        WHERE BOXES_ID_BOX IS NOT NULL
                        GROUP BY BOXES_ID_BOX
                        ORDER BY TOTAL DESC
                    )
                    WHERE ROWNUM = 1
                ) AS CITAS_BOX
            FROM DUAL
        `;

        const result = await connection.execute(
            sql,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const data = result.rows[0];

        return res.json({
            success: true,
            totalCitas: data.TOTAL_CITAS || 0,
            tipoMasAgendado: data.TIPO_MAS_AGENDADO || 'N/A',
            citasTipo: data.CITAS_TIPO || 0,
            diaMasAgendado: data.DIA_MAS_AGENDADO || 'N/A',
            citasDia: data.CITAS_DIA || 0,
            boxMasUsado: data.BOX_MAS_USADO ? `Box ${data.BOX_MAS_USADO}` : 'N/A',
            citasBox: data.CITAS_BOX || 0
        });

    } catch (err) {
        console.error("❌ Error Oracle:", err);
        return res.status(500).json({
            success: false,
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

app.get('/api/estadisticas-some', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        // 1. TOTAL CITAS
        const diaMasAgendadoResult = await connection.execute(
                `
                SELECT DIA
                FROM (
                    SELECT
                        TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH') AS DIA,
                        COUNT(*) AS TOTAL
                    FROM CITA_MEDICA
                    GROUP BY TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH')
                    ORDER BY TOTAL DESC
                )
                WHERE ROWNUM = 1
                `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        diaMasAgendado: diaMasAgendadoResult.rows[0]?.DIA?.trim() || 'N/A'

        // 2. SERVICIO MÁS AGENDADO
        const servicioResult = await connection.execute(
            `
            SELECT * FROM (
                SELECT
                    CASE C.CARTA_SERVICIO_ID_SERV
                        WHEN 1 THEN 'Control Médico'
                        WHEN 6 THEN 'Atención Psicológica'
                        WHEN 7 THEN 'Revisión Dental'
                        ELSE 'Otro'
                    END AS SERVICIO,
                    COUNT(*) AS TOTAL
                FROM CITA_MEDICA C
                GROUP BY C.CARTA_SERVICIO_ID_SERV
                ORDER BY TOTAL DESC
            )
            WHERE ROWNUM = 1
            `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 3. DÍA MÁS AGENDADO
        const diaResult = await connection.execute(
            `
            SELECT * FROM (
                SELECT
                    CASE TO_CHAR(FECHA, 'D', 'NLS_DATE_LANGUAGE=SPANISH')
                        WHEN '1' THEN 'Domingo'
                        WHEN '2' THEN 'Lunes'
                        WHEN '3' THEN 'Martes'
                        WHEN '4' THEN 'Miércoles'
                        WHEN '5' THEN 'Jueves'
                        WHEN '6' THEN 'Viernes'
                        WHEN '7' THEN 'Sábado'
                    END AS DIA,
                    COUNT(*) AS TOTAL
                FROM CITA_MEDICA
                GROUP BY TO_CHAR(FECHA, 'D', 'NLS_DATE_LANGUAGE=SPANISH')
                ORDER BY TOTAL DESC
            )
            WHERE ROWNUM = 1
            `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 4. BOX MÁS USADO
        const boxResult = await connection.execute(
            `
            SELECT * FROM (
                SELECT B.NUMB_BOX AS BOX, COUNT(*) AS TOTAL
                FROM CITA_MEDICA C
                INNER JOIN BOXES B ON B.ID_BOX = C.BOXES_ID_BOX
                GROUP BY B.NUMB_BOX
                ORDER BY TOTAL DESC
            )
            WHERE ROWNUM = 1
            `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Mapeo seguro de los resultados
        const totalCitas = totalResult.rows[0]?.TOTAL || 0;
        const servicio = servicioResult.rows[0];
        const dia = diaResult.rows[0];
        const box = boxResult.rows[0];

        return res.json({
            success: true,
            totalCitas,
            tipoMasAgendado: servicio?.SERVICIO || 'N/A',
            citasTipo: servicio?.TOTAL || 0,
            diaMasAgendado: dia?.DIA || 'N/A',
            citasDia: dia?.TOTAL || 0,
            boxMasUsado: box?.BOX || 'N/A',
            citasBox: box?.TOTAL || 0
        });

    } catch (err) {
        console.error("Error estadísticas:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error("Error al cerrar conexión en estadísticas:", e);
            }
        }
    }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));