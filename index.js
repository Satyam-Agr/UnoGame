import express, { Router } from 'express';//import express
import path from 'path';//path object
import { fileURLToPath }  from "url";//for absoluti path
import fs from 'fs';//data file system(json file)
import http from 'http'//to create a http server
import {Server} from 'socket.io'//for dynamic communication 
//file connections
import viewRoutes from './routes/viewRoutes.js'//import routes
import registerSockets from './sockets/index.js'//import socket logic;

const __filename = fileURLToPath(import.meta.url);//absoluti path of this file
const __dirname = path.dirname(__filename);//absoluti path of this file's directory

//create an server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

//static files middleware
app.use(express.static(path.join(__dirname, 'public')));

//data parsing middleware
app.use(express.urlencoded({ extended: true })); //to parse urlencoded form data
app.use(express.json()); //to parse json data

//ejs template engine setup
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

//to stablish a server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

//Game Logic
const games = {};
const players = {};

//all routes
app.use('/',viewRoutes(players, games))

//404 page(catches all other routes)
app.use((req, res) => {
  res.status(404).send('404:Page Not Found')
})

//connect socket module
registerSockets(io, games, players);
