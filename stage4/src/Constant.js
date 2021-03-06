export const REACT_ELEMENT_TYPE = Symbol.for('react.element');

export const FIBERTAGS = {
    ClassComponent: 1,
    HostRoot: 3,
    HostComponent: 5,
    HostText: 6,
};

export const EffectTags = {
    NoEffect: 0,
    PerformedWork: 1,
    Placement: 2,
    Update: 4,
    Deletion: 8,
};