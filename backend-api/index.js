const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());


const TMDB_API_KEY = 'eaf45f010e951b56986a7210ee0a4f99';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';


const dbUsers = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MyP@ssword1',
    database: 'projectapp'
});



const dbMovies = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MyP@ssword1',
    database: 'tmdb_app'
});

dbUsers.connect(err => {
    if (err) return console.error(' Error BD projectapp:', err);
    console.log(' Conectado a BD projectapp (usuarios)');
});

dbMovies.connect(err => {
    if (err) return console.error(' Error BD tmdb_app:', err);
    console.log(' Conectado a BD tmdb_app (películas)');
});


app.post('/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan datos' });

    try {
        const hashedPass = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`;

        dbUsers.query(sql, [nombre, email, hashedPass], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El correo ya está registrado' });
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Usuario registrado exitosamente' });
        });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Faltan datos" });

    const sql = `SELECT * FROM usuarios WHERE email = ?`;

    dbUsers.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(400).json({ error: 'Usuario no existe' });

        const user = results[0];
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: user.id }, 'secreto', { expiresIn: '1h' });

        res.json({
            message: 'Login exitoso',
            token,
            user: { id: user.id, nombre: user.nombre, email: user.email }
        });
    });
});

app.get('/media/:id/:type', async (req, res) => {
    const { id, type } = req.params;
    const sql = "SELECT * FROM movies WHERE id_tmdb = ?";

    dbMovies.query(sql, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.json(results[0]);

        try {
            const response = await axios.get(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=es-ES`);
            const m = response.data;

            const insertSql = `
                INSERT INTO movies (id_tmdb, title, overview, poster_path, release_date, media_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            dbMovies.query(insertSql, [
                m.id,
                m.title || m.name,
                m.overview,
                m.poster_path,
                m.release_date || m.first_air_date,
                type
            ]);

            res.json(m);
        } catch (error) {
            res.status(500).json({ error: "Error obteniendo datos desde TMDb" });
        }
    });
});


app.get('/peliculas', (req, res) => {
    const sql = `SELECT * FROM movies ORDER BY release_date DESC`;
    dbMovies.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


app.post('/favorites/add', async (req, res) => {
    const { user_id, movie_tmdb_id, media_type } = req.body;

    if (!user_id || !movie_tmdb_id || !media_type)
        return res.status(400).json({ error: "Faltan datos: user_id, movie_tmdb_id y media_type son requeridos" });

    try {
        dbMovies.query("SELECT * FROM movies WHERE id_tmdb = ?", [movie_tmdb_id], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            if (results.length === 0) {
                try {
                    const response = await axios.get(`${TMDB_BASE_URL}/${media_type}/${movie_tmdb_id}?api_key=${TMDB_API_KEY}&language=es-ES`);
                    const m = response.data;

                    const insertMovieSql = `
                        INSERT INTO movies (id_tmdb, title, overview, poster_path, release_date, media_type)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    dbMovies.query(insertMovieSql, [
                        m.id,
                        m.title || m.name,
                        m.overview,
                        m.poster_path,
                        m.release_date || m.first_air_date,
                        media_type
                    ]);
                } catch (error) {
                    return res.status(500).json({ error: "Error obteniendo película desde TMDb" });
                }
            }

            const sqlFav = `INSERT IGNORE INTO favorites (user_id, movie_tmdb_id) VALUES (?, ?)`;
            dbMovies.query(sqlFav, [user_id, movie_tmdb_id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Favorito agregado y película guardada si no existía" });
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Error agregando favorito" });
    }
});

app.get('/favorites/:user_id', (req, res) => {
    const { user_id } = req.params;
    const sql = `
        SELECT f.movie_tmdb_id, m.title, m.poster_path, m.media_type
        FROM favorites f
        LEFT JOIN movies m ON f.movie_tmdb_id = m.id_tmdb
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    `;
    dbMovies.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/lists/create', (req, res) => {
    const { user_id, name } = req.body;
    if (!user_id || !name) return res.status(400).json({ error: "Faltan datos" });

    const sql = "INSERT INTO lists (user_id, name) VALUES (?, ?)";
    dbMovies.query(sql, [user_id, name], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lista creada" });
    });
});

app.post('/lists/add-item', (req, res) => {
    const { list_id, movie_tmdb_id } = req.body;
    if (!list_id || !movie_tmdb_id) return res.status(400).json({ error: "Faltan datos" });

    const sql = `INSERT INTO list_items (list_id, movie_tmdb_id) VALUES (?, ?)`;
    dbMovies.query(sql, [list_id, movie_tmdb_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Item agregado a la lista" });
    });
});

app.get('/lists/:list_id/items', (req, res) => {
    const { list_id } = req.params;
    const sql = `
        SELECT li.movie_tmdb_id, m.title, m.poster_path, m.media_type
        FROM list_items li
        LEFT JOIN movies m ON li.movie_tmdb_id = m.id_tmdb
        WHERE li.list_id = ?
    `;
    dbMovies.query(sql, [list_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

const seedPopularMovies = async () => {
    try {
        const resp = await axios.get(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=es-ES&page=1`);
        const movies = resp.data.results;
        movies.forEach(m => {
            const sql = `
                INSERT IGNORE INTO movies (id_tmdb, title, overview, poster_path, release_date, media_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            dbMovies.query(sql, [m.id, m.title, m.overview, m.poster_path, m.release_date, 'movie'], (err) => {
                if (err) console.error(' Error insertando película seed:', err.message);
            });
        });
        console.log(` Seed: insertadas ${movies.length} películas populares`);
    } catch (err) {
        console.error(' Error obteniendo películas para seed:', err.message);
    }
};

seedPopularMovies();

app.listen(3000, '0.0.0.0', () => {
    console.log(' Servidor corriendo en el puerto 3000');
});
