import React from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Buffer } from 'ipfs'

let _this

const ChatContainer = styled.div`
  padding: 1em;
  padding-left:0px!important
`
const ContainerSend = styled.div`
  display: flex;
  margin-bottom: 25px;
`
const InputNickname = styled.input`
 width:25%!important;
 margin-right:0.5em;
`
const ChatName = styled.h4`
//cursor:pointer;
margin-bottom: 0.5em!important;
    padding: 0.5em;
   background-color: rgba(0,0,0,0.1)!important;
   width: 100%;
    margin: 0 auto;
    text-align:center;
`
export class Chat extends React.Component {


  constructor(props) {
    super(props);
    _this = this
    this.state = {
      ipfs: this.props.ipfs,
      orbitdb: this.props.orbitdb,
      ipfsId: null,
      _message: {
        nickname: "",
        message: "",
        status: "message"
      },
      chatWith: 'All',
      dbIsReady: false,

    };


  }

  render() {
    return (
      <ChatContainer>
        {_this.state.dbIsReady ?
           <ChatName>Chat With : <b>{_this.state.chatWith}</b></ChatName> :
           <ChatName> <b>Loading Chat..</b></ChatName>}

        <textarea id="chatArea"
          name="chatArea"
          rows="10"
          cols="50"
          readOnly
          value={_this.props.output}>
        </textarea>
        <br></br>
        <br></br>
        <ContainerSend>
          <InputNickname
            disabled={!_this.state.dbIsReady}
            type="text" id="nickname"
            name="nickname"
            placeholder="nickname">
          </InputNickname>
          <input
            disabled={!_this.state.dbIsReady}
            id="msg"
            name="msg"
            type="text"
            placeholder="type message"
            onKeyPress={(ev) => {
              if (ev.key === 'Enter') {
                _this.handleUpdateMsg()
                ev.preventDefault();
              }
            }}></input>
          <button 
          disabled={!_this.state.dbIsReady} 
          onClick={this.handleUpdateMsg}>Send.</button>
        </ContainerSend>
      </ChatContainer>
    );
  }



  handleUpdateMsg(event) {

    const msgValue = document.getElementById("msg").value // get message from input 
    const nicknameValue = document.getElementById("nickname").value // get username from input
    _this.setState(prevState => ({
      ...prevState,
      message: {
        nickname: nicknameValue,
        msg: msgValue,
        channel: _this.props.channelSend
      }
    }))
    _this.sendMessg(nicknameValue, msgValue, _this.props.channelSend, false);
    document.getElementById("msg").value = ""
    _this.props.changeUserName(true, nicknameValue)
  }
  //Sends a message  to a specific channel
  async sendMessg(nickname, message, channel, useLocalChannel) {
    if (!_this.state.ipfs) return;
    let ch = channel
    if (useLocalChannel) ch = _this.props.channelSend
    let userName = nickname
    // eslint-disable-next-line
    const id = _this.state.ipfsId
    const msgText = { username: userName, message: message, status: "message" }
    const msgEncoded = Buffer.from(JSON.stringify(msgText))
    _this.state.ipfs.pubsub.publish(ch, msgEncoded)
   /* if (_this.props.channelSend == _this.props.PUBSUB_CHANNEL)*/ 
   _this.props.query(userName, msgText.message);
  }
  componentDidMount() {
    const usernameElement = document.getElementById("nickname")
    usernameElement.value = this.props.username
  }
  componentDidUpdate(prevProps) {
    // update props  change in component update

    if (this.props !== prevProps) {
      this.setState({
        ipfs: this.props.ipfs,
        orbitdb: this.props.orbitdb,
        ipfsId: this.props.ipfsId,
        _message: {
          nickname: this.props.username,
          message: "",
          status: "message"
        },
        chatWith: this.props.chatWith,
      })
      if (this.props.username !== prevProps.username) {
        const usernameElement = document.getElementById("nickname")
        usernameElement.value = this.props.username
      }
      if (this.props.dbIsReady !== prevProps.dbIsReady) {
        this.setState({
          dbIsReady: this.props.dbIsReady
        })
      }
    }
  }
}

Chat.propTypes = {
  ipfs: PropTypes.object,
  orbitdb: PropTypes.object,
  ipfsId: PropTypes.string,
  output: PropTypes.string,
  channelSend: PropTypes.string,
  PUBSUB_CHANNEL: PropTypes.string,
  query: PropTypes.func,
  changeUserName: PropTypes.func,
  username: PropTypes.string,
  chatWith: PropTypes.string,
  dbIsReady: PropTypes.bool

}
export default Chat;