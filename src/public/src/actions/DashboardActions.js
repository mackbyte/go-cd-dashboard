export const updateDashboards = (pipelines) => dispatch => {
    dispatch({
        type: 'UPDATE_PIPELINES',
        pipelines
    });
};