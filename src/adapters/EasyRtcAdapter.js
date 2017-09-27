var naf = require('../NafIndex');
var INetworkAdapter = require('./INetworkAdapter');

class EasyRtcAdapter extends INetworkAdapter {

  constructor(easyrtc) {
    super();
    this.app = 'default';
    this.room = 'default';
    this.easyrtc = easyrtc;

    this.audioStreams = {};
  }

  setServerUrl(url) {
    this.easyrtc.setSocketUrl(url);
  }

  setApp(appName) {
    this.app = appName;
  }

  setRoom(roomName) {
    this.room = roomName;
    this.easyrtc.joinRoom(roomName, null);
  }

  // options: { datachannel: bool, audio: bool }
  setWebRtcOptions(options) {
    // this.easyrtc.enableDebug(true);
    this.easyrtc.enableDataChannels(options.datachannel);

    this.easyrtc.enableVideo(false);
    this.easyrtc.enableAudio(options.audio);

    this.easyrtc.enableVideoReceive(false);
    this.easyrtc.enableAudioReceive(options.audio);
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener){
    this.easyrtc.setRoomOccupantListener(function(roomName, occupants, primary) {
      occupantListener(occupants);
    });
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.easyrtc.setDataChannelOpenListener(openListener);
    this.easyrtc.setDataChannelCloseListener(closedListener);
    this.easyrtc.setPeerListener(messageListener);
  }

  connect() {
    var that = this;
    var connectedCallback = function(id) {
      that._myRoomJoinTime = that._getRoomJoinTime(id);
      that.connectSuccess(id);
    };

    if (this.easyrtc.audioEnabled) {
      this._connectWithAudio(connectedCallback, this.connectFailure);
    } else {
      this.easyrtc.connect(this.app, connectedCallback, this.connectFailure);
    }
  }

  shouldStartConnectionTo(client) {
    return this._myRoomJoinTime <= client.roomJoinTime;
  }

  startStreamConnection(clientId) {
    this.easyrtc.call(clientId,
      function(caller, media) {
        if (media === 'datachannel') {
          naf.log.write('Successfully started datachannel to ', caller);
        }
      },
      function(errorCode, errorText) {
        console.error(errorCode, errorText);
      },
      function(wasAccepted) {
        // console.log("was accepted=" + wasAccepted);
      }
    );
  }

  closeStreamConnection(clientId) {
    // Handled by easyrtc
  }

  sendData(clientId, dataType, data) {
    this.easyrtc.sendPeerMessage(clientId, dataType, data);
  }

  sendDataGuaranteed(clientId, dataType, data) {
    this.easyrtc.sendDataWS(clientId, dataType, data);
  }

  broadcastData(dataType, data) {
    var destination = {targetRoom: this.room};
    this.easyrtc.sendPeerMessage(destination, dataType, data);
  }

  broadcastDataGuaranteed(dataType, data) {
    var destination = {targetRoom: this.room};
    this.easyrtc.sendDataWS(destination, dataType, data);
  }

  getConnectStatus(clientId) {
    var status = this.easyrtc.getConnectStatus(clientId);

    if (status == this.easyrtc.IS_CONNECTED) {
      return INetworkAdapter.IS_CONNECTED;
    } else if (status == this.easyrtc.NOT_CONNECTED) {
      return INetworkAdapter.NOT_CONNECTED;
    } else {
      return INetworkAdapter.CONNECTING;
    }
  }


  /**
   * Privates
   */

  _connectWithAudio(connectSuccess, connectFailure) {
    var that = this;

    this.easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
      that.audioStreams[easyrtcid] = stream;
    });

    this.easyrtc.setOnStreamClosed(function (easyrtcid) {
      delete that.audioStreams[easyrtcid];
    });

    this.easyrtc.initMediaSource(
      function(){
        that.easyrtc.connect(that.app, connectSuccess, connectFailure);
      },
      function(errorCode, errmesg){
        console.error(errorCode, errmesg);
      }
    );
  }

  _getRoomJoinTime(clientId) {
    var myRoomId = naf.room;
    var joinTime = easyrtc.getRoomOccupantsAsMap(myRoomId)[clientId].roomJoinTime;
    return joinTime;
  }
}

module.exports = EasyRtcAdapter;
