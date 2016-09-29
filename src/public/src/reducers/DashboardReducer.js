import { combineReducers } from 'redux'
import pipelines from './PipelinesReducer';

const dashboardReducer = combineReducers({
    pipelines
});

export default dashboardReducer;