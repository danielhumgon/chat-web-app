import React from 'react';
import PropTypes from 'prop-types'
import styled from 'styled-components'


let _this
const StatusContainer = styled.div`
  display:flex;
  padding: 1em;
  padding-bottom:0px!important;
  justify-content:center;
`
const StatusText = styled.p`
  padding: 1em;
`

export class Status extends React.Component {


  constructor(props) {
    super(props);
    _this = this
    this.state = {
      ipfs: this.props.ipfs,
      orbitdb: this.props.orbitdb,
      isConnected: false,
      masterConnected: false

    };


  }

  render() {
    return (
      <StatusContainer >
        <StatusText >
          NODE IPFS:{' '}
          <b>
            {_this.state.ipfs === null
              ? ` Not Instantiated`
              : ` Instantiated`}
          </b>
        </StatusText>
        <StatusText >
          ORBITDB:
          <b>
            {_this.state.orbitdb === null
              ? ` Not Instantiated  `
              : `Instantiated  `}
          </b>
        </StatusText>
        <StatusText >
          IPFS CONNECTION:{' '}
          <b>
            {_this.state.masterConnected === false
              ? ` Establishing Connection..  `
              : ` Connected!!  `}
          </b>
        </StatusText>
        <StatusText >
          CHAT STATUS:{' '}
          <b>
            {_this.state.isConnected === false
              ? ` Disconnected  `
              : ` Connected!!  `}
          </b>
        </StatusText>
      </StatusContainer>
    );
  }
  componentDidUpdate(prevProps) {
    // update props  change in component update

    if (this.props !== prevProps) {
      this.setState({
        ipfs: this.props.ipfs,
        orbitdb: this.props.orbitdb,
        isConnected: this.props.isConnected,
        masterConnected: this.props.masterConnected,
      });

    }
  }
}

Status.propTypes = {
  ipfs: PropTypes.object,
  orbitdb: PropTypes.object,
  isConnected: PropTypes.bool,
  masterConnected: PropTypes.bool

}
export default Status;