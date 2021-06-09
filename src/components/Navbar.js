import React, { Component } from 'react'

class Navbar extends Component {

  render() {
    return (
      <nav className="navbar navbar-dark fixed-top color-nav flex-md-nowrap p-0 shadow">
        <a
          className="navbar-brand col-sm-3 col-md-2 mr-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Peer to Peer Bet
        </a>

        <ul className="navbar-nav px-3">
          <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
            <a className="text-secondary">
              <a id="account">Current Account : {this.props.account}</a>
            </a>
          </li>
        </ul>
      </nav>
    );
  }
}

export default Navbar;
