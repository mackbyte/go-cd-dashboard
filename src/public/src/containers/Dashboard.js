import React from 'react';
import { connect } from 'react-redux';
import { updateDashboards } from './../actions/DashboardActions';
import PipelineGroup from './../components/PipelineGroup';
import io from 'socket.io-client';
import config from '../config/config';
import $ from 'jquery';
import '../util/Snowfall';

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

    componentDidMount() {
        $('.dashboard').snowfall({
            flakeCount : 100,
            flakeColor : '#ffffff',
            flakePosition: 'absolute',
            flakeIndex: 999999,
            minSize : 10,
            maxSize : 20,
            minSpeed : 1,
            maxSpeed : 2,
            round : true,
            shadow : true,
            collection : false,
            collectionHeight : 40,
            deviceorientation : false
        });
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        pipelines: state.pipelines
    }
};

export default connect(mapStateToProps)(Dashboard)
