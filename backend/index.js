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
        
        // Usamos ":u" en lugar de ":uid" para descartar conflictos de palabras reservadas
        const sql = `SELECT USUARIO_ID_TP_USER FROM PACIENTE WHERE FIREBASE_UID = :u`;

        // Pasamos el parámetro como un array simple. Esto es lo más seguro para evitar el ORA-01745
        const result = await connection.execute(
            sql, 
            [uid.trim()], 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log("Resultado de búsqueda en Oracle:", result.rows);

        if (result.rows && result.rows.length > 0) {
            const idTipo = result.rows[0].USUARIO_ID_TP_USER;
            let rolTexto = '';

            if (idTipo === 1) {
                rolTexto = 'SOME';
            } else if (idTipo === 3) {
                rolTexto = 'PACIENTE';
            } else {
                rolTexto = 'DESCONOCIDO';
            }

            res.json({ success: true, rol: rolTexto });
        } else {
            res.status(404).json({ success: false, error: "Usuario no encontrado" });
        }
    } catch (err) {
        // Imprimimos el error completo para ver el 'offset'
        console.error("❌ Error Detallado:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) await connection.close();
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
app.get('/api/disponibilidad-medica/:fecha', async (req, res) => {
    const { fecha } = req.params;
    let connection;

    console.log(`\n--- NUEVA SOLICITUD DE AGENDA PARA LA FECHA: ${fecha} ---`);

    try {
        connection = await oracledb.getConnection(dbConfig);

        const sql = `
            SELECT M.NOMB_MED || ' ' || M.APELL_PAT_MED AS NOMBRE_PROFESIONAL, 
                TO_CHAR(A.HORA_INI, 'HH24:MI') AS HORA_COMPLETA
            FROM AGEND_MED A
            INNER JOIN MEDICO M ON 
                REPLACE(REPLACE(A.MEDICO_RUN_MED, '.', ''), '-', '') = 
                REPLACE(REPLACE(M.RUN_MED, '.', ''), '-', '')
            WHERE TRUNC(A.DIA_SEMANA) = TO_DATE(:f, 'YYYY-MM-DD')
            ORDER BY NOMBRE_PROFESIONAL, HORA_COMPLETA ASC
        `;

        const result = await connection.execute(
            sql, 
            { f: fecha }, 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // LOG CRÍTICO: Esto nos dirá si Oracle encuentra filas o no
        console.log(`Filas encontradas directamente en Oracle para el ${fecha}:`, result.rows);

        const agrupado = {};
        
        result.rows.forEach(fila => {
            const nombre = fila.NOMBRE_PROFESIONAL;
            const hora = fila.HORA_COMPLETA;

            if (!agrupado[nombre]) {
                agrupado[nombre] = {
                    nombreMedico: nombre,
                    horas: []
                };
            }
            agrupado[nombre].horas.push(hora);
        });

        const respuestaFinal = Object.values(agrupado);
        console.log("Estructura final enviada a Ionic:", JSON.stringify(respuestaFinal));

        res.json(respuestaFinal);

    } catch (err) {
        console.error("❌ Error interno del servidor en Oracle:", err.message);
        res.status(500).json({ error: "Error al consultar la agenda médica." });
    } finally {
        if (connection) await connection.close();
    }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));