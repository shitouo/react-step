export const REACT_ELEMENT_TYPE = Symbol.for('react.element');

export const FIBERTAGS = {
    ClassComponent: 1,
    HostRoot: 3,
    HostComponent: 5,
};

export const EFFECTTAGS = {
    NoEffect: 0,
    Placement: 2,
    Update: 4,
    Deletion: 8,
    Incomplete: 1024,
};

export const DomEvents = ['onClick', 'onChange'];