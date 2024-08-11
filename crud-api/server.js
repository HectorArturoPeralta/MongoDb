const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://ArturoPeralta:ER.gwasz8ZuycA7@integradora.8gkspi2.mongodb.net/prueba?retryWrites=true&w=majority&appName=Integradora', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

// Esquemas y Modelos

const administrativoSchema = new mongoose.Schema({
    Nombre: { type: String, required: true, maxlength: 100 },
    ClaveUnica: { type: String, required: true, unique: true, maxlength: 50 },
    Contraseña: { type: String, required: true, maxlength: 100 },
    Fecha_nac: { type: Date, required: true },
    RFC: { type: String, required: true, unique: true, maxlength: 13 },
    CURP: { type: String, required: true, unique: true, maxlength: 18 },
    Direccion: { type: String, required: true },
    Comentarios: { type: String },
    Estado: { type: String, enum: ['Activo', 'Inactivo'], required: true }
});

const empleadoSchema = new mongoose.Schema({
    Nombre: { type: String, required: true, maxlength: 100 },
    CURP: { type: String, required: true, unique: true, maxlength: 18 },
    RFC: { type: String, required: true, unique: true, maxlength: 13 },
    Direccion: { type: String, required: true },
    Fecha_nac: { type: Date, required: true },
    Contraseña: { type: String, required: true, maxlength: 100 },
    Estado: { type: String, enum: ['Activo', 'Inactivo'], required: true },
    Telefono: { type: String, required: true, maxlength: 15 }
});

const clienteSchema = new mongoose.Schema({
    Nombre: { type: String, required: true, maxlength: 100 },
    Municipio: { type: String, required: true, maxlength: 100 },
    Direccion: { type: String, required: true },
    Celular: { type: String, required: true, maxlength: 15 },
    Correo: { type: String, required: true, unique: true, maxlength: 100 },
    Contraseña: { type: String, required: true, maxlength: 100 },
    Estado: { type: String, enum: ['Activo', 'Inactivo'], required: true }
});

const tinacoSchema = new mongoose.Schema({
    id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    Litros: { type: Number, required: true },
    Nivel: { type: Number, required: true }
});

const mantenimientoSchema = new mongoose.Schema({
    id_Tinaco: { type: mongoose.Schema.Types.ObjectId, ref: 'Tinaco', required: true },
    Comentarios: { type: String },
    Realizado: { type: String, enum: ['Realizado', 'Pendiente'], required: true },
    Fecha: { type: Date, required: true },
    Hora: { type: String, required: true }
});

const mensajeSchema = new mongoose.Schema({
    id_cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    id_administrativo: { type: mongoose.Schema.Types.ObjectId, ref: 'Administrativo' },
    id_empleado: { type: mongoose.Schema.Types.ObjectId, ref: 'Empleado' },
    Mensaje: { type: String, required: true },
    Fecha: { type: Date, required: true },
    Hora: { type: String, required: true }
});

const Administrativo = mongoose.model('Administrativo', administrativoSchema);
const Empleado = mongoose.model('Empleado', empleadoSchema);
const Cliente = mongoose.model('Cliente', clienteSchema);
const Tinaco = mongoose.model('Tinaco', tinacoSchema);
const Mantenimiento = mongoose.model('Mantenimiento', mantenimientoSchema);
const Mensaje = mongoose.model('Mensaje', mensajeSchema);

// CRUD básico para cada entidad
const modelsMap = { Administrativo, Empleado, Cliente, Tinaco, Mantenimiento, Mensaje };

Object.keys(modelsMap).forEach(entity => {
    const Model = modelsMap[entity];

    // Create
    app.post(`/api/${entity.toLowerCase()}`, async (req, res) => {
        try {
            const newRecord = new Model(req.body);
            const savedRecord = await newRecord.save();
            res.status(201).send(savedRecord);
        } catch (err) {
            console.error(`Error al crear ${entity}:`, err);
            res.status(500).send(`Error al crear ${entity}: ` + err.message);
        }
    });

    // Read all
    app.get(`/api/${entity.toLowerCase()}`, async (req, res) => {
        try {
            const records = await Model.find();
            res.status(200).send(records);
        } catch (err) {
            console.error(`Error al obtener ${entity}:`, err);
            res.status(500).send(`Error al obtener ${entity}: ` + err.message);
        }
    });

    // Read by id
    app.get(`/api/${entity.toLowerCase()}/id/:id`, async (req, res) => {
        try {
            const record = await Model.findById(req.params.id);
            if (!record) {
                return res.status(404).send(`${entity} no encontrado`);
            }
            res.status(200).send(record);
        } catch (err) {
            console.error(`Error al obtener ${entity} por ID:`, err);
            res.status(500).send(`Error al obtener ${entity} por ID: ` + err.message);
        }
    });

    // Update by id
    app.put(`/api/${entity.toLowerCase()}/id/:id`, async (req, res) => {
        try {
            const updatedRecord = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedRecord) {
                return res.status(404).send(`${entity} no encontrado para actualizar`);
            }
            res.status(200).send(updatedRecord);
        } catch (err) {
            console.error(`Error al actualizar ${entity} por ID:`, err);
            res.status(500).send(`Error al actualizar ${entity} por ID: ` + err.message);
        }
    });

    // Delete by id
    app.delete(`/api/${entity.toLowerCase()}/id/:id`, async (req, res) => {
        try {
            const deletedRecord = await Model.findByIdAndDelete(req.params.id);
            if (!deletedRecord) {
                return res.status(404).send(`${entity} no encontrado para eliminar`);
            }
            res.status(200).send({ message: `${entity} eliminado exitosamente.` });
        } catch (err) {
            console.error(`Error al eliminar ${entity} por ID:`, err);
            res.status(500).send(`Error al eliminar ${entity} por ID: ` + err.message);
        }
    });
});

// Endpoint para insertar un mensaje
app.post('/api/mensajes', async (req, res) => {
    try {
        const { id_cliente, id_administrativo, Mensaje: mensajeTexto, Fecha, Hora } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!id_cliente || !id_administrativo || !mensajeTexto || !Fecha || !Hora) {
            return res.status(400).send('Todos los campos son requeridos');
        }

        const nuevoMensaje = new Mensaje({
            id_cliente,
            id_administrativo,
            Mensaje: mensajeTexto,
            Fecha,
            Hora
        });

        const mensajeGuardado = await nuevoMensaje.save();
        res.status(201).json({ message: 'Solicitud de llenado recibida correctamente', data: mensajeGuardado });
    } catch (err) {
        console.error('Error al insertar mensaje:', err);
        res.status(500).send('Error al insertar mensaje: ' + err.message);
    }
});

// Endpoint para obtener datos del tinaco por id_cliente
app.get('/api/tinaco', async (req, res) => {
    try {
        const { id_cliente } = req.query;

        if (!id_cliente) {
            return res.status(400).send('id_cliente es requerido');
        }

        const tinaco = await Tinaco.findOne({ id_cliente }).populate('id_cliente');

        if (!tinaco) {
            return res.status(404).send('Tinaco no encontrado para el cliente proporcionado');
        }

        res.status(200).send(tinaco);
    } catch (err) {
        console.error('Error al obtener datos del tinaco:', err);
        res.status(500).send('Error al obtener datos del tinaco: ' + err.message);
    }
});

// Endpoint para el login del cliente
app.post('/api/cliente/login', async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(400).send('Correo y contraseña son requeridos');
        }

        const cliente = await Cliente.findOne({ Correo: correo, Contraseña: contraseña });

        if (!cliente) {
            return res.status(401).send('Credenciales inválidas');
        }

        // Eliminar la contraseña antes de enviar la respuesta
        const clienteSinContraseña = cliente.toObject();
        delete clienteSinContraseña.Contraseña;

        res.status(200).send(clienteSinContraseña);
    } catch (err) {
        console.error('Error durante el inicio de sesión del cliente:', err);
        res.status(500).send('Error durante el inicio de sesión: ' + err.message);
    }
});

// Endpoint para el login del trabajador (empleado)
app.post('/api/trabajador/login', async (req, res) => {
    try {
        const { rfc, contraseña } = req.body;

        if (!rfc || !contraseña) {
            return res.status(400).send('RFC y contraseña son requeridos');
        }

        const empleado = await Empleado.findOne({ RFC: rfc, Contraseña: contraseña });

        if (!empleado) {
            return res.status(401).send('Credenciales inválidas');
        }

        // Eliminar la contraseña antes de enviar la respuesta
        const empleadoSinContraseña = empleado.toObject();
        delete empleadoSinContraseña.Contraseña;

        res.status(200).send(empleadoSinContraseña);
    } catch (err) {
        console.error('Error durante el inicio de sesión del trabajador:', err);
        res.status(500).send('Error durante el inicio de sesión: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
