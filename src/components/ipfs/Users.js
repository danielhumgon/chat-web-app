/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components'

const OnlinesName = styled.p`
cursor:pointer;
margin-bottom: 0.5em!important;
    padding: 0.5em;
    background-color: rgba(0,0,0,0.1)!important;
   width: 95%;
    margin: 0 auto;
`
let _this
export class Users extends React.Component {


    constructor(props) {
        super(props);
        _this = this
        this.state = {
            ipfs: this.props.ipfs,
            orbitdb: this.props.orbitdb,
            ipfsId: null,
            dbId: null,
            onlineNodes: [],
            PUBSUB_CHANNEL: '',
            channel: '',
            chatWith: 'All',
        };


    }

    render() {
        return (
            <div>
                <p>Onlines Nodes :  <b>{_this.state.onlineNodes ? _this.state.onlineNodes.length : '0'}</b></p>
                <OnlinesName key="keyMaster" id={_this.props.PUBSUB_CHANNEL} onClick={() => this.subscribeToOtherChannel(_this.props.PUBSUB_CHANNEL)} ><b>ALL</b></OnlinesName>
                {_this.state.onlineNodes && _this.state.onlineNodes.map((val, i) => <OnlinesName key={val.username + i} id={val.keiId} onClick={() => this.subscribeToOtherChannel(val)} >{val.username ? val.username : val} </OnlinesName>)}
            </div>
        );
    }


    async subscribeToOtherChannel(value) {
        let channelName;

        let chatName = ''
        if (value === _this.props.PUBSUB_CHANNEL) {

            if (_this.state.chatWith === 'All') return
            //  changeCh(PUBSUB_CHANNEL)
            chatName = 'All'
            channelName = await _this.props.requestPersonChat(value, true)

        } else if (_this.state.ipfsId != value.keyId) {

            if (_this.state.chatWith === value.username) return
            chatName = value.username

            channelName = await _this.props.requestPersonChat(value.keyId)
        }


        _this.setState(prevState => ({
            chatWith: chatName,
            channel: channelName
        }))
        _this.props.updateChatName(chatName)
    }

    componentDidMount() {

    }
    componentDidUpdate(prevProps) {
        // update props  change in component update

        if (this.props !== prevProps) {
            this.setState({
                ipfs: this.props.ipfs,
                orbitdb: this.props.orbitdb,
                onlineNodes: this.props.onlineNodes,
                ipfsId: this.props.ipfsId,
                onlineNodes: this.props.onlineNodes
            })




        }
    }


}

Users.propTypes = {
    ipfs: PropTypes.object,
    orbitdb: PropTypes.object,
    onlineNodes: PropTypes.array,
    PUBSUB_CHANNEL: PropTypes.string,
    ipfsId: PropTypes.string,
    requestPersonChat: PropTypes.func,
    updateChatName: PropTypes.func

}
export default Users;