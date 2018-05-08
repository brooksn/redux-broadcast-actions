import { Middleware } from 'redux'

export interface MiddlewareDefaultOptions {
  errorKey?: string
  metaKey?: string
  storageKey?: string
  testKey?: string
}

const middlewareDefaultOptions: MiddlewareDefaultOptions = {
  errorKey: '__redux-broadcast-actions_error__',
  metaKey: 'broadcast',
  storageKey: '__redux-broadcast-actions_action__',
  testKey: '__redux-broadcast-actions_storage-test__'
}

function localStorageAvailable(testKey = middlewareDefaultOptions.testKey) {
  try {
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)

    return true
  } catch (e) {
    return false
  }
}

function shouldStoreAction(action, metaKey, testKey) {
  return typeof action.meta === 'object' && action.meta && action.meta[metaKey] && localStorageAvailable(testKey)
}

/**
 * Creates an instance of redux broadcast middleware
 * @param {object} [options]
 * @param {string} [options.metaKey="broadcast"] The property name to set to "true" on an action's meta object, defaults to "broadcast"
 * @param {string} [options.errorKey="__redux-broadcast-actions_error__"] The localStorage key at which actions which cannot be parsed will be stored
 * @param {string} [options.storageKey="__redux-broadcast-actions_action__"] The localStorage key at which actions will be stored and immediately removed to broadcast actions
 * @param {string} [options.testKey="__redux-broadcast-actions_storage-test__"] The localStorage key at which a test string will be stored and immediately removed at initialization
 */
export function broadcastMiddleware(options = middlewareDefaultOptions): Middleware {
  const { errorKey, metaKey, storageKey, testKey } = {
    ...middlewareDefaultOptions,
    ...options
  }

  return function middleware({ dispatch }) {
    if (localStorageAvailable() && typeof storageKey === 'string') {
      window.addEventListener('storage', function handleStorageEvent(event) {
        if (
          event.key === storageKey &&
          typeof event.newValue === 'string' &&
          event.newValue &&
          event.isTrusted !== false
        ) {
          try {
            const { action } = JSON.parse(event.newValue)

            dispatch({
              ...action,
              meta: { ...action.meta, [metaKey]: null }
            })
          } catch (err) {
            dispatch({
              type: errorKey,
              meta: { event },
              payload: err
            })
          }
        }
      })
    }

    return next => {
      return action => {
        if (shouldStoreAction(action, metaKey, testKey)) {
          window.localStorage.setItem(storageKey, JSON.stringify({ action }))
          window.localStorage.removeItem(storageKey)
        }

        return next(action)
      }
    }
  }
}
