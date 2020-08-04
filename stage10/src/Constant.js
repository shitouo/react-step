export const REACT_ELEMENT_TYPE = Symbol.for('react.element');
export const REACT_CONTEXT_TYPE = Symbol.for('react.context');
export const REACT_PROVIDER_TYPE = Symbol.for('react.provider');

export const MaxSigned31BitInt = 1073741823;

export const FIBERTAGS = {
    FunctionComponent: 0,
    ClassComponent: 1,
    HostRoot: 3,
    HostComponent: 5,
    HostText: 6,
    ContextConsumer: 9,
    ContextProvider: 10,
};

export const EffectTags = {
    NoEffect: 0,
    PerformedWork: 1,
    Placement: 2,
    Update: 4,
    Deletion: 8,
    UnmountLayout: 16,
    MountLayout: 32,
    MountPassive: 64,
    UnmountPassive: 128,
    Passive: 512,
};

export const UpdateTags = {
    updateState: 0,
    ReplaceState: 1,
    ForceUpdate: 2,
    CaptureUpdate: 3,
}

export const workTime = {
    noWork: 0,
    sync: 1073741823,
} 

export const modeMap = {
    NoContext: 0,
    ConcurrentMode: 1,
}