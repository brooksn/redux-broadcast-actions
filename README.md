# Redux Broadcast Actions

[Redux middleware](https://redux.js.org/advanced/middleware) to dispatch certain actions in all open windows.

[![npm version](https://img.shields.io/npm/v/redux-broadcast-actions.svg)](https://www.npmjs.com/package/redux-broadcast-actions)

```
npm install --save redux-broadcast-actions
```

## Use cases

You may encounter situations where an application open in multiple tabs or windows must share some state, like user preferences or authentication tokens. In browsers that support writing to `localStorage`, certain actions may be dispatched to all open tabs or windows.

```js
{
  type: 'USER_PREFERENCE_CHANGED',
  payload: { color: 'blue' },
  meta: { broadcast: true }
  // The user expects to see personalization changes reflected immediately.
}
```

```js
{
  type: 'REFRESH_TOKEN_FULFILLED',
  payload: { newToken: 'abc.123.xyz' },
  meta: { broadcast: true }
  // If two windows A and B share an authentication token, and the token is refreshed in window A (invalidating the old token),
  // then window B will receive the same action and can discard its old, invalid token.
}
```

## Motivation

Redux middleware exist that cache parts of the state to `localStorage` or another browser storage API, and load these values into the store's initial state. However, changes to these data in one window are not automatically synced to other windows. One solution to sharing to these special slices of state updates with other windows could be to enhance the store to check for changes in the browser's cached values, and to update the state directly. However, this approach causes "follower" windows to lose the context of the change-originating action dispatched by the "leader".

Changes to `localStorage` [trigger an event](https://developer.mozilla.org/en-US/docs/Web/Events/storage) in all windows except that which caused the initial change.

This middleware shares actions between open windows. You may additionally cache special parts of state in `localStorage` or otherwise.

## Caveats

This middleware will have no effect in browsers where writing to localStorage is not allowed. This may occur if localStorage is not implemented, if a storage quota has been reached, or if the browser is in a private browsing mode. This middleware does not handle persisting state to `localStorage`. There are existing middleware designed to handle this, or you can [implement it yourself](https://stackoverflow.com/questions/35305661/where-to-write-to-localstorage-in-a-redux-app#answer-35675304).

## Example

First, install `redux-broadcast-actions` as a project dependency.

```
npm install --save redux-broadcast-actions
```

```js
import { applyMiddleware, createStore } from 'redux'
import { broadcastMiddleware } from 'redux-broadcast-action'

const counter = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    case 'SQUARE':
      return state * state
    default:
      return state
  }
}

// The options object is not required, and the following values will be used by default.
const broadcastMiddlewareOptions = {
  metaKey: 'broadcast', // This is the property of an action's meta object which indicates an action should be broadcast.
  errorKey: '__redux-broadcast-actions_error__', // Actions which cannot be parsed are stored with this key.
  storageKey: '__redux-broadcast-actions_action__', // Actions marked to be broadcast are stored with this key, then immediately removed.
  testKey: '__redux-broadcast-actions_storage-test__' // A localStorage item is created with this key and immediately removed to test localStorage.
}

const middleware = broadcastMiddleware(broadcastMiddlewareOptions)

// redux 1.0.0 and later
let store = applyMiddleware(middleware)(createStore)(counter, 0)

// redux 3.1.0 and later
store = createStore(counter, 0, applyMiddleware(middleware))

// The increment and decrement action creators will create ordinary actions.
// The square action creator will create an action that will be broadcast to all open tabs and windows.

function increment() {
  return {
    type: 'INCREMENT'
  }
}

function decrement() {
  return {
    type: 'DECREMENT'
  }
}

function square() {
  return {
    type: 'SQUARE',
    meta: { broadcast: true } // The meta key may be renamed to something other than "broadcast" in broadcastMiddlewareOptions.
  }
}

// Whatever the value of the counter in each window, it will be squared.
store.dispatch(square())
```

## License

ISC
