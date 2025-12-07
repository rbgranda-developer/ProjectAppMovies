const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MyP@ssword1',
    database: 'projectapp'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL exitosamente');
});

app.post('/registro', (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Usuario registrado exitosamente' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(400).json({ error: 'Usuario no existe' });
        }

        const usuario = results[0];

        if (usuario.password !== password) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: usuario.id }, 'secreto', { expiresIn: '1h' });

        res.json({
            message: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Servidor corriendo en el puerto 3000 (Accesible externamente)');
});
