const pipelines = (state = {}, action) => {
    switch(action.type) {
        case 'UPDATE_PIPELINES':
            return {
                ...action.pipelines
            };
        default:
            return state;
    }
};

export default pipelines;