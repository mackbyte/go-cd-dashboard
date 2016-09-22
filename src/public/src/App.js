import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
    constructor() {
        super();

        this.state = {
            pipelines: {}
        };
    }

    componentDidMount() {
        const self = this;
        fetch('/api/pipelines', {
            accept: 'application/json',
        }).then(response => {
            response.json().then(data => self.setState({pipelines: data}));
        });
    }

    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h2>Welcome to React</h2>
                </div>
                <p className="App-intro">
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
                <p>{JSON.stringify(this.state.pipelines)}</p>
            </div>
        );
    }
}

export default App;
