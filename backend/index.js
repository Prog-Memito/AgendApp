const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
// con esto puede ionic pueda conectarce
app.use(cors());
app.use(express.json());

// Configuración de la conexión a Oracle
const dbConfig = {
    user: 'AgendApp',
    password: 'AgendApp',
    connectString: 'localhost:1521/xe'
};

// Endpoint para validar existencia en el CESFAM (Pre-enrolamiento)
app.get('/api/validar-paciente/:run', async (req, res) => {
    const { run } = req.params;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT NOMB_PAC, APELL_PAT_PAC, ESTADO_ID_ESTADO
            FROM PACIENTE
            WHERE RUN_PAC = :run`,
            [run],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                valido: false, 
                mensaje: "El RUN no figura en los registros del CESFAM." 
            });
        }

        const paciente = result.rows[0];

        if (paciente.ESTADO_ID_ESTADO !== 1) {
            return res.status(403).json({ 
                valido: false, 
                mensaje: "El paciente se encuentra inactivo en el sistema." 
            });
        }

        res.json({
            valido: true,
            nombre: `${paciente.NOMB_PAC} ${paciente.APELL_PAT_PAC}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        if (connection) await connection.close();
    }
});

// Vincular el paciente en Oracle con su cuenta de Firebase
app.post('/api/vincular-paciente', async (req, res) => {
    const { email, run, firebaseUID } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `UPDATE PACIENTE 
             SET EMAIL = :email, 
                 FIREBASE_UID = :firebaseUID,
                 PASS = 'FIREBASE_MANAGED' 
             WHERE RUN_PAC = :run`,
            {
                email: email,
                firebaseUID: firebaseUID,
                run: run
            },
            { autoCommit: true }
        );

        if (result.rowsAffected && result.rowsAffected > 0) {
            res.json({
                success: true,
                mensaje: "Cuenta activada y vinculada con éxito."
            });
        } else {
            res.status(404).json({ success: false, mensaje: "No se encontró el RUN para actualizar." });
        }

    } catch (err) {
        console.error("Error al vincular en Oracle:", err);
        res.status(500).json({ error: "No se pudo vincular el usuario en la base de datos local." });
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * NUEVO: Verificar personal SOME para vinculación automática (Opción B)
 * Este verifica si el correo existe en PERS_SOME antes de intentar el login en Firebase.
 */
app.post('/api/verificar-personal', async (req, res) => {
    const { email } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        const result = await connection.execute(
            `SELECT RUN_SOME, FIREBASE_UID FROM PERS_SOME WHERE EMAIL = :email`,
            [email],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                mensaje: "El correo no pertenece al personal administrativo." 
            });
        }

        const personal = result.rows[0];
        
        res.json({
            success: true,
            yaVinculado: personal.FIREBASE_UID ? true : false,
            run: personal.RUN_SOME
        });

    } catch (err) {
        console.error("Error al verificar personal:", err);
        res.status(500).json({ error: "Error al consultar datos del personal." });
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * NUEVO: Vincular UID de personal SOME
 * Registra el UID generado por Firebase en la tabla PERS_SOME.
 */
app.post('/api/vincular-personal', async (req, res) => {
    const { run, firebaseUID } = req.body;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        await connection.execute(
            `UPDATE PERS_SOME SET FIREBASE_UID = :firebaseUID WHERE RUN_SOME = :run`,
            { firebaseUID: firebaseUID, run: run },
            { autoCommit: true }
        );

        res.json({ success: true, mensaje: "Personal vinculado correctamente." });
    } catch (err) {
        console.error("Error al vincular personal:", err);
        res.status(500).json({ error: "No se pudo vincular el UID del personal." });
    } finally {
        if (connection) await connection.close();
    }
});

/**
 * Endpoint: Obtener el rol del usuario (SOLO SOME Y PACIENTE)
 */
app.get('/api/obtener-rol/:uid', async (req, res) => {
    const { uid } = req.params;
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // 1. Buscamos primero en PERS_SOME
        let result = await connection.execute(
            `SELECT 'SOME' as ROL, ID_TP_USER FROM PERS_SOME WHERE FIREBASE_UID = :uid`, 
            [uid],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 2. Si no es SOME, buscamos en PACIENTE
        if (result.rows.length === 0) {
            result = await connection.execute(
                `SELECT 'PACIENTE' as ROL, ID_TP_USER FROM PACIENTE WHERE FIREBASE_UID = :uid`, 
                [uid],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        }

        if (result.rows.length > 0) {
            const data = result.rows[0];
            res.json({ 
                success: true, 
                rol: data.ROL, 
                id_rol: data.ID_TP_USER 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: "Usuario no autorizado o no encontrado en el sistema." 
            });
        }
    } catch (err) {
        console.error("Error al obtener rol:", err);
        res.status(500).json({ error: "Error de servidor al verificar permisos." });
    } finally {
        if (connection) await connection.close();
    }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));