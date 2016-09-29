export const updateDashboards = () => dispatch => {
    fetch('/api/pipelines', {accept: 'application/json'})
        .then(response => response.json()
            .then(data => {
                dispatch({
                    type: 'UPDATE_PIPELINES',
                    pipelines: data
                });
            })
        );
};