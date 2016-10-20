import React from 'react';
import ReactDOM from 'react-dom';
import Pipeline from './Pipeline';

it('renders without crashing', () => {
    const div = document.createElement('div');
    const pipeline = {
        "name": 'Build',
        "status": 'Passed',
        "build-number": 1
    };
    const groupName = 'Test';

    ReactDOM.render(<Pipeline pipeline={pipeline} groupName={groupName}/>, div);
});