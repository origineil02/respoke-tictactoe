console.log('module UI js')
var appid = "dc0feacb-13c7-44c8-ad19-0acdd3c6a9dd";

   //respoke.log.setLevel('debug');
   
var UUID = function(){
     
    this.value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
    
    }

var ServiceController = function(APP){ 
          var self = this;
          self.APP = APP
          //self.connected = ko.observable(false);
          console.log('client')
          self.APP.client = respoke.createClient({
           appId: 'dc0feacb-13c7-44c8-ad19-0acdd3c6a9dd',
           developmentMode: true
          })
          
        
        self.disconnect = function(){
           console.log('Disconnect Request')
           this.client.disconnect();
           this.user.connected(false)
        }
         
        self.connect = function(){
            console.log("Connect Request")
            var self = this;
            self.client.connect({
              endpointId: self.user.id()
            }).done(function(){self.user.onConnected(self.client)}) 
            self.client.setPresence('available')
        }
        
        self.join = function(id, cb){
            this.APP.client.join({id: id}).then(cb)
        }
        
        self.listen = function(key, cb){
            this.APP.client.listen(key, cb)
        } 
        
        self.listen('message', function(evt){
              console.log('recieved message')
              console.log(evt)
              var obj = ko.mapping.fromJSON(evt.message.message);
              obj.endpointId = ko.observable(evt.endpoint.id)
              self.APP.process(obj)
          });
          
        self.message = function(id, message){
           console.log("Sending " + id + " a message")
           var endpoint = this.APP.client.getEndpoint({ id: id });
           endpoint.sendMessage({message: ko.toJSON(message)})
        }
    }
    
    
    var User = function(APP){
         var self = this;
         this.APP = APP
         this.id = ko.observable();
         this.moveToken = ko.observable();
         this.connected = ko.observable(false);
         this.opponent = ko.observable();
         this.openInvitations = ko.observableArray([]);
         this.isMyTurn= ko.observable(false)
       
       
       self.addInvitation = function(details){
             console.log("Add invitation")
           var invite = ko.utils.arrayFirst(this.openInvitations(), function(item){
               return item.endpointId() == details.endpointId() 
           })
           console.log(invite)
          if(!invite){this.openInvitations.push(details)}
          else{console.log('Ignoring invitation')}
       }
       
       self.declineInvitation = function(self, invitation){
           self.user.openInvitations.remove(invitation)
       }
       
       self.acceptInvitation = function(self, invitation){
           
           self.user.openInvitations.remove(invitation)
           
           var uuid = new UUID().value;
           //console.log(uuid)
           self.user.opponent({group: uuid, id: invitation.endpointId()})
           //self.service.join( uuid )
           
           console.log('Accepting invitation from ' + invitation.endpointId() )
           
           //init game state
           var first = Math.floor((Math.random() * 100) + 1) > 50; 
           self.user.moveToken(first ? 'X' : 'O')
           self.user.isMyTurn(first)
           
           self.service.message(invitation.endpointId(), {type: 'start', group: uuid, first: !first})
            
       }
       
       self.onConnected = function(client){
           var self = this;
           console.log('Successfully connected');
           this.connected(true)
           client.join({
                id: 'everyone'
            }).then(function(group){self.onJoinGroup(group, self.APP)});
       }
       
       self.onJoinGroup = function(group, APP){
           console.log(APP)
           console.log("Group joined")
           APP.lobby.group(group)
           
           group.listen('join',  function(evt) {evt.target.getMembers().then(function(args){APP.lobby.members(args)})})
           group.listen('leave', function(evt) {evt.target.getMembers().then(function(args){APP.lobby.members(args)})}) 
       }
       
       self.onInvitation = function(evt){
           console.log('Invitation')
           console.log(evt)
       }
       
    }
    
    
var DrawChecker = function(board){
    this.board = board;
    var self = this;
    this.isDraw = function(){
    for (row = 0; row < self.board.length; ++row) {
      for (column = 0; column < self.board[row].length; ++column) {
        if(!self.board[row][column].value()){
          return false
        }
      }
    }
    return true;
  }
}

var RowChecker = function(){
  this.isSolved = function(row){
     if (row.length == 0) { return false }

     var target = row[0].value()

     if (!target) { return false }

     for (i = 1; i < row.length; ++i) {
       if (row[i].value() != target) {
        //console.log('value fail ' + row[i] + ' vs ' + target)
        return false;
       }
     }

     return { by: target }
   }
}

var ColumnChecker = function(board){
        this.board = board;
        var self = this;
    this.isSolved = function(column){
    
     if(self.board.length == 0 || !self.board[0][column]){return false}
            
     var target = self.board[0][column].value()
            
     if(!target){return false}
            
     for (row = 1; row < self.board.length; ++row) {
         if (self.board[row][column].value() != target) {
          return false;
         }
     }
     return {by: target};
  }
}

var DiagonalChecker = function(board){
    this.board = board;
    var self = this;
    this.isSolved = function(){
    if(self.board.length == 0){return false}
            
            var diagonalRunner = {
                up: function() {
                 
                  var target = self.board[0][0] ? self.board[0][0].value() : ''
                  if(!target){return false}
                  for(var i = 1; i < self.board.length; i++){
                    
                    if(self.board[i][i].value() != target){return false}
                  }
                  return {by: target}
               },
                down: function(){
                    var target = self.board[self.board.length-1][0] ? self.board[self.board.length-1][0].value() : ''
                     if(!target){return false}
                  for(var i = 0; i < self.board.length; i++){
                    
                    if(self.board[self.board.length - 1 - i][i].value() != target){return false}
                  }
                  return {by: target}
                }
            }
             
            return diagonalRunner.up() || diagonalRunner.down()
  }
  }
var SolveChecker = function(board){
        this.board = board;
        this.rowChecker = new RowChecker();
        this.columnChecker = new ColumnChecker(board);
        this.diagonalChecker = new DiagonalChecker(board);
    
     this.isSolved = function(){
      var self = this;
    
       var solution = function(){
       for(var x = 0; x < self.board.length; ++x ){
         //console.log(i)
        var isRowSolved = self.rowChecker.isSolved(self.board[x])
        var isColumnSolved = self.columnChecker.isSolved(x)
        var isDiagonalSolved = self.diagonalChecker.isSolved()
        //console.log(isDiagonalSolved)
        var solution = isRowSolved || isColumnSolved || isDiagonalSolved
        if(solution){
            console.log("Solution " + x)
             console.log(solution)
            return solution;
        }
      }
    }
    return solution();
    
    }
    }
function Cell(){
    return {value: ko.observable('')}
}
 
function init() {
    var rows = []
    for(i =0; i < 3; ++i ){
        rows.push([])
        for(j=0; j < 3; ++j ){
            rows[i].push(new Cell(0))
        }
    }
    return rows;
}

var VideoController = function(vm){
    
        var self = this;
        self.APP = vm;
        self.activeCall = ko.observable(false)
        self.callOptions= {
//                    constraints: {audio: true, video: true},
//                    previewLocalMedia: function(element, call){ 
//                       self.setVideo('localVideoSource', element)
//                       call.approve();
//                    },
                    onLocalMedia: function(evt) {
                        self.setVideo('localVideoSource', evt.element)
                    },
                    onConnect: function(evt) {
                        self.setVideo('remoteVideoSource', evt.element)
                    }
                };
                console.log(self.activeCall())
    this.setVideo = function(id, ele){
        var videoParent = document.getElementById(id);
        videoParent.innerHTML = "";
        videoParent.appendChild(ele);
    }
    this.call = function(){
         var self = this;
         console.log('Calling ' + self.user.opponent().id )
         var recipientEndpoint = self.client.getEndpoint({ id: self.user.opponent().id });
         var result = recipientEndpoint.startVideoCall(self.videoController.callOptions);
         self.videoController.activeCall(result);
         
         self.client.listen('call', self.videoController.answer)
    }
    this.answer = function(evt){
        var call = evt.call
        var self = this;
        console.log(self)
         if (call.caller !== true) {
              self.activeCall(call)
              call.answer(self.callOptions);
         }
    }
    this.hangup = function(){
        var self = this;
        console.log('hangup request')
        self.videoController.activeCall().hangup();
        self.videoController.activeCall(null)
    }
    }
var Lobby = function(){
    
        var self = this;
        this.group = ko.observable()
        this.members = ko.observableArray([])
        
        this.group.subscribe(function(group){
            console.log("Group change")
            group.getMembers().then(function(args){console.log(args.length); self.members(args)})
        })
    }

var VM = function(){
  var self = this;
   
    self.videoController = new VideoController(this);
    self.lobby = new Lobby();
    self.service = new ServiceController(this);
     
    self.board = ko.observableArray(init())
    self.user = new User(this);
//    self.toggler = ko.observable(false)
    self.winner = ko.observable(false)

    self.isGameOver = ko.computed(function(){
    
      var board = self.board()
      var result = new SolveChecker(board).isSolved()
    
      if(result && result.by){
        console.log(result.by)
        self.winner(result.by == self.user.moveToken())
        return true
      } 
      return new DrawChecker(board).isDraw();
    });
    
   this.quit =function(){
      
     this.service.message(this.user.opponent().id, {type: 'quit'})  
     this.user.opponent(null)
     this.board(init())
   }
   this.invite= function(self, target){ 
       console.log('inviting ' + target)
       self.service.message(target, {type: 'invitation'})
   }
   this.move = function(self, cell){
       console.log("move")
       cell.value(self.user.moveToken())
       self.user.isMyTurn(false)
       var msg = {type: 'move', board: self.board()}
       self.service.message(self.user.opponent().id, msg)    
   }
   this.process = function(obj){
       var self = this;
       var handler = {
           invitation: function(details){
               console.log('Handle Invitation')
               console.log(ko.toJSON(details))
               self.user.addInvitation(details)
           },
           start: function(details){
               
               self.user.moveToken(details.first() ? 'X' : 'O')
               self.user.isMyTurn(details.first())
               self.user.opponent({group: details.group(), id: details.endpointId()})
           },
           move: function(details){
               self.user.isMyTurn(true)
               self.board(details.board())
           },
           quit: function(details){
               alert('Opponent quit the game');
               self.user.opponent(null);
               self.board(init())
           }
       }[obj.type()]
       
       if(handler){handler(obj)}
   }
   this.exitGame = function(){
      this.user.opponent(null)
      this.board(init())
   }
   }
   
var vm = new VM()
ko.applyBindings(vm)