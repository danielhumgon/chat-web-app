/* eslint-disable */
import React from 'react'
import { Users } from '../components/ipfs/Users'
import { Chat } from '../components/ipfs/Chat'
import { Status } from '../components/ipfs/Status'
import Layout from '../components/layout'
import { Buffer } from 'ipfs'
import Helmet from 'react-helmet'

//Imports OrbitDB and IPFS, preventing the HTML5 error on build
const IPFS = typeof window !== `undefined` ? require('ipfs') : null
const OrbitDB = typeof window !== `undefined` ? require('orbit-db') : null


//Addresses to make the connection
//const MASTER_MULTIADDR = `/ip4/138.68.212.34/tcp/4003/ws/ipfs/QmauKY7Sh47ZD49oy9VT1e9djHXmUjXfP6qPn4CnbEcXSn`
const MASTER_MULTIADDR = `/dns4/wss.psfoundation.cash/tcp/443/wss/ipfs/QmauKY7Sh47ZD49oy9VT1e9djHXmUjXfP6qPn4CnbEcXSn`
let DB_ADDRESS = `/orbitdb/zdpuAzAkWaD6niC8AjSt1jb1pVx9fwECFC96dsczSQvTrH1Di/orbitddbchatappipfs987979`

let myDateConnection = new Date()
let PUBSUB_CHANNEL = 'ipfsObitdb-chat'//Name of the main channel for IPFS pubsub
const DB_NAME_CONTROL_USERNAMES = 'controlUsersName1234885' //Database name to store the username
let channelsSuscriptions = []
let myNameStoreKey = 'myUsername'// key from get username from db
let db_nicknameControl
let db 

let _this


export class chatapp extends React.Component {
  state = {
    ipfs: null,
    orbitdb: null,
    masterConnected: false,
    onlineNodes: [],
    ipfsId: '',
    channelSend: 'ipfsObitdb-chat', //Channel where messages are going to be sent
    output: '',  //saves chat messages to be visualized
    isConnected: false, // Controls connection status
    success: false,
    username: 'Node' + Math.floor(Math.random() * 900 + 100).toString(),
    chatWith: 'All',
    dbIsReady: false,
  }

  constructor(props) {
    super(props)
    _this = this
    if (!IPFS || !OrbitDB) return
    if (_this.state.ipfs) return //Checks if already exists a node
    //connect to IPFS
    const ipfs = new IPFS({
      repo: './orbitdbipfs/chatapp/ipfs',
      EXPERIMENTAL: {
        pubsub: true,
      },
      relay: {
        enabled: true, // enable circuit relay dialer and listener
        hop: {
          enabled: true, // enable circuit relay HOP (make this node a relay)
        },
      },
      config: {
        Addresses: {
          Swarm: [MASTER_MULTIADDR],
        },
      },
    })

    ipfs.on('ready', async () => {
      console.log('ipfs ready')

      if (typeof window !== 'undefined') window.ipfs = ipfs

      //Create OrbitDB instance
      const optionsDb = {
        directory: './orbitdbipfs/chatapp/store',
      }
      const orbitdb = await OrbitDB.createInstance(ipfs, optionsDb)
      console.log('orbitdb ready')

      //store ipfs and orbitdb in state
      let ipfsId = await ipfs.id()
      _this.setState({
        ipfs: ipfs,
        orbitdb: orbitdb,
        ipfsId: ipfsId.id,
      })

      // Connect to the chat server.
      // Multiple connections will blacklist the server.
      await _this.state.ipfs.swarm.connect(MASTER_MULTIADDR)
      console.log(`Connected to master node.`)
      _this.setState({
        masterConnected: true,
      })

      //Instantiated db key value for store my username
      try {
        const access = {
          // Give write access to everyone
          write: ['*'],
        }
        db_nicknameControl = await orbitdb.keyvalue(
          DB_NAME_CONTROL_USERNAMES,
          access
        )
        await db_nicknameControl.load()
        console.log(`db_nicknameControl id: ${db_nicknameControl.id}`)
      } catch (e) {
        console.error(e)
      }
      _this.getUserName() // get my last username 

      _this.createDb(DB_ADDRESS) // create db

      //subscribe to master channel
      channelsSuscriptions.push(PUBSUB_CHANNEL)
      _this.state.ipfs.pubsub.subscribe(PUBSUB_CHANNEL, data => {

        const jsonData = JSON.parse(data.data.toString())
        if (jsonData.onlineNodes) { // controller for online nodes in the chat app
          let onlineUsers = []
          for (var nodes in jsonData.onlineNodes) {
            jsonData.onlineNodes[nodes].username
              ? onlineUsers.push(jsonData.onlineNodes[nodes])
              : onlineUsers.push(nodes)
          }
          let Nodes = [...onlineUsers]

          if (_this.state.onlineNodes != onlineUsers) {
            _this.setState({
              onlineNodes: [...onlineUsers],
            })

          }
        }
        //recived status online to master for control my status
        if (jsonData.status === 'online' && jsonData.username === 'system') {
          if (_this.state.isConnected === false) {
            _this.setState({
              isConnected: true,
            })
            myDateConnection = new Date()
          }
        }
      })

      //send status online to master for control online users
      setInterval(() => {
        if (!_this.state.ipfs) return
        const msg = { status: 'online', username: _this.state.username }
        const msgEncoded = Buffer.from(JSON.stringify(msg))
        _this.state.ipfs.pubsub.publish(PUBSUB_CHANNEL, msgEncoded, err => {
          if (err) {
            return console.error(`failed to publish to ${PUBSUB_CHANNEL}`, err)
          }
        })

        // verify my connection status, verifies the time that has without receiving messages from master node   
        if ((new Date() - myDateConnection) / 1500 > 6) {
          _this.setState({
            isConnected: false,
          })
          //  console.log("Disconneted")
        }
      }, 1000)

      //Subscribe to my own channel.
      //This subscription controls the peer to peer petitions
      channelsSuscriptions.push(ipfsId.id)
      _this.state.ipfs.pubsub.subscribe(ipfsId.id, data => {
        const jsonData = JSON.parse(data.data.toString())
        if (jsonData.peer1 === ipfsId.id) { //Checks if i'm the one who makes the petition
          _this.setState({
            channelSend: jsonData.channelName,
          })
          let flag = true
          _this.createDb(jsonData.dbName, true) // create db for p2p chat
          for (let i = 0; i < channelsSuscriptions.length; i++)
            // verify existing subscriptions
            if (flag && channelsSuscriptions[i] === jsonData.channelName)
              flag = false
          flag && _this.subscribe(jsonData.channelName)
        }
      })
    })
  }

  render() {
    return (
      <Layout>
        <Helmet>
          <title>Chat - Forty by HTML5 UP</title>
          <meta name="description" content="Elements Page" />
        </Helmet>
        <Status
          ipfs={_this.state.ipfs}
          orbitdb={_this.state.orbitdb}
          isConnected={_this.state.isConnected}
          masterConnected={_this.state.masterConnected}
        ></Status>
        <div className="grid-wrapper">
          <div className="col-4">
            <div >
              <Users
                ipfs={_this.state.ipfs}
                orbitdb={_this.state.orbitdb}
                onlineNodes={_this.state.onlineNodes}
                PUBSUB_CHANNEL={PUBSUB_CHANNEL}
                ipfsId={_this.state.ipfsId}
                requestPersonChat={_this.requestPersonChat}
                updateChatName={_this.updateChatName}
              ></Users>
            </div>
          </div>
          <div className="col-8">
            <Chat
              ipfs={_this.state.ipfs}
              orbitdb={_this.state.orbitdb}
              ipfsId={_this.state.ipfsId}
              dbIsReady={_this.state.dbIsReady}
              output={_this.state.output}
              channelSend={_this.state.channelSend}
              PUBSUB_CHANNEL={PUBSUB_CHANNEL}
              username={_this.state.username}
              query={_this.query}
              changeUserName={_this.getUserName}
              chatWith={_this.state.chatWith}
            ></Chat>
          </div>
        </div>

      </Layout>
    )
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async repeatedConnect(ipfs) {
    try {
      //const peers = await _this.state.ipfs.swarm.peers()
      //console.log(`peers: ${JSON.stringify(peers,null,2)}`)

      const peers = _this.state.ipfs.swarm.peers()
      console.log(`# of peers: ${peers.length}`)
      console.log(`peers: ${JSON.stringify(peers, null, 2)}`)

      console.log('Trying to connect to master')
      await _this.state.ipfs.swarm.connect(MASTER_MULTIADDR)

      _this.setState({
        masterConnected: true,
      })
      setTimeout(() => {
        console.log(_this.state.masterConnected)
      }, 1000);
    } catch (err) {
      await _this.sleep(5000)
      await _this.repeatedConnect(ipfs)
    }
  }
  // create event log db
  async createDb(db_addrs, createNew = false) {

    try {
      const access = {
        accessController: {
          write: ['*'],
          overwrite: true,
        },
      }
      db = await _this.state.orbitdb.eventlog(db_addrs, access)

      /*
      // for load progress 
      let _index = 0;
      let flag = true;
      const latest = [];
      // progresive load db
      db.events.on('load.progress', (address, hash, entry, progress, total) => {
        _index++;
        latest.push(entry);
        //console.log(entry)
        if (_index > 10 && flag) {
          flag = false;
          //_this.queryGet()
          _this.progresiveOuput(latest)
        }
      })*/
      await db.load()


      _this.setState({
        dbIsReady: true,
      })

      _this.queryGet()
      //Event that activates after DB replication
      db.events.on('replicated', db_addrs => {
        _this.queryGet()
        console.warn('replicated event')
      })
      //Event that activates before DB replication
      db.events.on('replicate', db_addrs => {
        _this.queryGet()
        console.warn('repli event')
      })

    } catch (e) {
      console.error(e)
    }
  }
  // for load progrssive output 
  async progresiveOuput(latestMsg) {
    console.log("query get")
    try {
      let latestMessages = latestMsg//db.iterator({ limit: 10 }).collect()
      let output = ''
      //desencrypt  here e.payload.value
      output +=
        latestMessages
          .reverse()
          .map(e => e.payload.value.nickname + ' : ' + e.payload.value.message)
          .join('\n') + `\n`
      _this.setState({
        output: output,
      })
    } catch (e) {
      console.error(e)
    }
  }
  // for subscribe to  others channels
  async subscribe(channelName) {
    if (_this.state.ipfs) return
    channelsSuscriptions.push(channelName)
    _this.state.ipfs.pubsub.subscribe(channelName, data => {
      const jsonData = JSON.parse(data.data.toString())
      if (jsonData.status === 'message') {
        _this.query(jsonData.username, jsonData.message)
      }
    })
    console.warn('subscribed to : ' + channelName)
  }
  // add entry in the db
  async query(nickname, message) {
    try {
      const entry = { nickname: nickname, message: message }
      //encrypt  entry here
      await db.add(entry)
      _this.queryGet()
    } catch (e) {
      console.error(e)
    }
  }
  // get entry's from db
  async queryGet() {
    console.log("query get")
    try {
      let latestMessages = db.iterator({ limit: 10 }).collect() // change the limit , to load more data(messages)
      let output = ''
      //desencrypt  here e.payload.value
      output +=
        latestMessages
          .map(e => e.payload.value.nickname + ' : ' + e.payload.value.message)
          .join('\n') + `\n`
      _this.setState({
        output: output,
      })
    } catch (e) {
      console.error(e)
    }
  }
  //Function that gets activated to create a private chat with another node
  async requestPersonChat(peerClient, reset) {
    if (_this.state.dbIsReady === false) return
    _this.setState({
      dbIsReady: false,
    })
    // reset returns the chat to group channel (ALL)
    if (reset) {
      _this.createDb(DB_ADDRESS)
      return PUBSUB_CHANNEL
    }

    const myID = _this.state.ipfsId
    const clientId = peerClient.toString()
    const newChannelName = myID + clientId
    
    //DB name for private chat
    const newDbName = newChannelName + '1232772'
    const msg = {
      status: 'requestChat', // key for request private chat
      channelName: newChannelName,
      dbName: newDbName,
      peer1: myID,//node that emits the petition
      peer2: clientId, // node that receives the petition
      dbId: db.id,
    }
    const msgEncoded = Buffer.from(JSON.stringify(msg))
    _this.state.ipfs.pubsub.publish(PUBSUB_CHANNEL, msgEncoded)

    return newChannelName
  }

  async updateChatName(chatname) {
    _this.setState({
      chatWith: chatname,
    })
  }
  // query for  update my Username from key store db
  async getUserName(changeUserName, username) {
    if (changeUserName === true) {
      if (username === _this.state.username) return
      await db_nicknameControl.set(myNameStoreKey, { username: username })
      _this.setState({
        username: username,
      })
      return
    }
    try {
      const userName = await db_nicknameControl.get(myNameStoreKey)
      if (userName) { // if there is already a name stored, it uses it
        _this.setState({
          username: userName.username,
        })
      } else { //if not, stores the name on the DB
        await db_nicknameControl.set(myNameStoreKey, {
          username: _this.state.username,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
}
export default chatapp
