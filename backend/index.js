const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

// --- PARCHE DE COMPATIBILIDAD ORACLE ---
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

// --- ENDPOINTS EXISTENTES (SIN CAMBIOS) ---

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

// --- ENDPOINT OBTENER ROL CORREGIDO (Línea del Error) ---
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

// Mostrar Estadísticas clave para el SOME en un solo endpoint optimizado
app.get('/api/estadisticas-some', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Subconsultas analíticas nativas ajustadas al DDL real del script SQL
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM CITA_MEDICA) AS TOTAL_CITAS,
                
                (SELECT S.NOMB_SERV 
                 FROM CITA_MEDICA C 
                 JOIN CARTA_SERVICIO S ON C.CARTA_SERVICIO_ID_SERV = S.ID_SERV 
                 GROUP BY S.NOMB_SERV 
                 ORDER BY COUNT(*) DESC 
                 FETCH FIRST 1 ROWS ONLY) AS TIPO_MAS_AGENDADO,
                (SELECT MAX(COUNT(*)) FROM CITA_MEDICA GROUP BY CARTA_SERVICIO_ID_SERV) AS CITAS_TIPO,
                
                (SELECT TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH') FROM CITA_MEDICA GROUP BY TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH') ORDER BY COUNT(*) DESC FETCH FIRST 1 ROWS ONLY) AS DIA_MAS_AGENDADO,
                (SELECT MAX(COUNT(*)) FROM CITA_MEDICA GROUP BY TO_CHAR(FECHA, 'DAY', 'NLS_DATE_LANGUAGE=SPANISH')) AS CITAS_DIA,
                
                (SELECT BOXES_ID_BOX FROM CITA_MEDICA WHERE BOXES_ID_BOX IS NOT NULL GROUP BY BOXES_ID_BOX ORDER BY COUNT(*) DESC FETCH FIRST 1 ROWS ONLY) AS BOX_MAS_USADO,
                (SELECT MAX(COUNT(*)) FROM CITA_MEDICA WHERE BOXES_ID_BOX IS NOT NULL GROUP BY BOXES_ID_BOX) AS CITAS_BOX
            FROM DUAL
        `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        
        if (result.rows && result.rows.length > 0) {
            const data = result.rows[0];
            
            res.json({
                success: true,
                totalCitas: data.TOTAL_CITAS || 0,
                tipoMasAgendado: data.TIPO_MAS_AGENDADO ? data.TIPO_MAS_AGENDADO.trim() : 'N/A',
                citasTipo: data.CITAS_TIPO || 0,
                diaMasAgendado: data.DIA_MAS_AGENDADO ? data.DIA_MAS_AGENDADO.trim() : 'N/A',
                citasDia: data.CITAS_DIA || 0,
                boxMasUsado: data.BOX_MAS_USADO ? `Box ${data.BOX_MAS_USADO}` : 'N/A',
                citasBox: data.CITAS_BOX || 0
            });
        } else {
            res.json({
                success: true,
                totalCitas: 0,
                tipoMasAgendado: 'N/A',
                citasTipo: 0,
                diaMasAgendado: 'N/A',
                citasDia: 0,
                boxMasUsado: 'N/A',
                citasBox: 0
            });
        }
    } catch (err) {
        console.error("❌ Error al calcular estadísticas en Oracle:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error al cerrar la conexión:", closeErr);
            }
        }
    }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));