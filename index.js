var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io') (server);

var rooms = 0;

let SERVER_PORT = 4999;

app.use(express.static('.'));

app.get('/', function (req, res){
    res.sendFile(__dirname + '/game.html');
});

io.on('connection', function(socket){
    //console.log('A user connected!');

    /**
     *  Create a new game room and notify the creator of game
     */

     socket.on('createGame', function(data){
         socket.join('room-' + ++rooms);
		 console.log("createGame boardSize: " + data.boardSize);
         socket.emit('newGame', {name: data.name, room: 'room-'+rooms, boardSize: data.boardSize});
     });


     /**
      *  Connect the Player 2 to the room he requested. Show error if room full.
      */

      socket.on('joinGame', function(data){
          var room = io.nsps['/'].adapter.rooms[data.room];
          if (room && room.length == 1){
              socket.join(data.room);
              socket.broadcast.to(data.room).emit('player1', {});
			  socket.broadcast.to(data.room).emit('giveSize', {room: data.room});
              socket.emit('player2', {name: data.name, room: data.room})
          }
          else{
			  
			  if(!room) {
				  socket.emit('err', {message: 'Room does not exist...' + data.room});
			  }
              if(room) {
				  socket.emit('err', {message: 'Room does not exist. ' + room.length});
			  }
          }
      });

      /**
       *  Handle the turn played by either player and notify the other.
       */

       socket.on('playTurn', function(data){
           socket.broadcast.to(data.room).emit('turnPlayed', {
               tile: data.tile,
               room: data.room
           });
       });


       /**
        *  Notify the players about the victor
        */
       socket.on('gameEnded', function(data){
           socket.broadcast.to(data.room).emit('gameEnd', data);
       });
});

server.listen(SERVER_PORT);