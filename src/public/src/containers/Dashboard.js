import React from 'react';
import { connect } from 'react-redux';
import { updateDashboards } from './../actions/DashboardActions';
import PipelineGroup from './../components/PipelineGroup';
import io from 'socket.io-client';
import config from '../config/config';

class Dashboard extends React.Component {
    componentWillMount() {
        const self = this;
        let socket = io('http://localhost:3000');

        socket.on('update', function(pipelines) {
            self.props.dispatch(updateDashboards(pipelines));
        });
    }

    render() {
        const { pipelines } = this.props;
        const { visible_groups } = config;

        return (
            <div className="dashboard">
                {Object.keys(pipelines)
                    .filter(groupName => visible_groups.indexOf(groupName) > -1)
                    .map((groupName, index) =>
                    <PipelineGroup key={index} name={groupName} group={pipelines[groupName]}/>
                )}
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        pipelines: state.pipelines
    }
};

export default connect(mapStateToProps)(Dashboard)
