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

// Endpoint para validar existencia en el CESFAM
app.get('/api/validar-paciente/:run', async (req, res) => {
    const { run } = req.params;
    let connection;

try {
    connection = await oracledb.getConnection(dbConfig);
    
    //Buscamos si el rut exite en la DB y si su estado es activo
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

    //Verificacion si el paciente se encuentra activo en el sistema
    if (paciente.ESTADO_ID_ESTADO !== 1) {
            return res.status(403).json({ 
                valido: false, 
                mensaje: "El paciente se encuentra inactivo en el sistema." 
            });
        }

    // Si todo está bien, devolvemos el éxito y el nombre
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

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));

