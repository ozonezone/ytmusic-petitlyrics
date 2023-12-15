// ==UserScript==
// @name       YTMusic PetitLyrics
// @namespace  npm/ytmusic-petitlyrics
// @version    0.0.0
// @author     monkey
// @match      https://music.youtube.com/*
// @grant      GM.xmlHttpRequest
// ==/UserScript==

(function () {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  const sharedConfig = {
    context: void 0,
    registry: void 0
  };
  const equalFn = (a, b) => a === b;
  const $PROXY = Symbol("solid-proxy");
  const $TRACK = Symbol("solid-track");
  const signalOptions = {
    equals: equalFn
  };
  let runEffects = runQueue;
  const STALE = 1;
  const PENDING = 2;
  const UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  const NO_INIT = {};
  var Owner = null;
  let Transition = null;
  let Listener = null;
  let Updates = null;
  let Effects = null;
  let ExecCount = 0;
  function createRoot(fn, detachedOwner) {
    const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
      owned: null,
      cleanups: null,
      context: current ? current.context : null,
      owner: current
    }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
    Owner = root;
    Listener = null;
    try {
      return runUpdates(updateFn, true);
    } finally {
      Listener = listener;
      Owner = owner;
    }
  }
  function createSignal(value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const s = {
      value,
      observers: null,
      observerSlots: null,
      comparator: options.equals || void 0
    };
    const setter = (value2) => {
      if (typeof value2 === "function") {
        value2 = value2(s.value);
      }
      return writeSignal(s, value2);
    };
    return [readSignal.bind(s), setter];
  }
  function createComputed(fn, value, options) {
    const c = createComputation(fn, value, true, STALE);
    updateComputation(c);
  }
  function createRenderEffect(fn, value, options) {
    const c = createComputation(fn, value, false, STALE);
    updateComputation(c);
  }
  function createEffect(fn, value, options) {
    runEffects = runUserEffects;
    const c = createComputation(fn, value, false, STALE);
    if (!options || !options.render)
      c.user = true;
    Effects ? Effects.push(c) : updateComputation(c);
  }
  function createMemo(fn, value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const c = createComputation(fn, value, true, 0);
    c.observers = null;
    c.observerSlots = null;
    c.comparator = options.equals || void 0;
    updateComputation(c);
    return readSignal.bind(c);
  }
  function isPromise(v) {
    return v && typeof v === "object" && "then" in v;
  }
  function createResource(pSource, pFetcher, pOptions) {
    let source;
    let fetcher;
    let options;
    if (arguments.length === 2 && typeof pFetcher === "object" || arguments.length === 1) {
      source = true;
      fetcher = pSource;
      options = pFetcher || {};
    } else {
      source = pSource;
      fetcher = pFetcher;
      options = pOptions || {};
    }
    let pr = null, initP = NO_INIT, scheduled = false, resolved = "initialValue" in options, dynamic = typeof source === "function" && createMemo(source);
    const contexts = /* @__PURE__ */ new Set(), [value, setValue] = (options.storage || createSignal)(options.initialValue), [error, setError] = createSignal(void 0), [track, trigger] = createSignal(void 0, {
      equals: false
    }), [state, setState] = createSignal(resolved ? "ready" : "unresolved");
    function loadEnd(p, v, error2, key) {
      if (pr === p) {
        pr = null;
        key !== void 0 && (resolved = true);
        if ((p === initP || v === initP) && options.onHydrated)
          queueMicrotask(
            () => options.onHydrated(key, {
              value: v
            })
          );
        initP = NO_INIT;
        completeLoad(v, error2);
      }
      return v;
    }
    function completeLoad(v, err) {
      runUpdates(() => {
        if (err === void 0)
          setValue(() => v);
        setState(err !== void 0 ? "errored" : resolved ? "ready" : "unresolved");
        setError(err);
        for (const c of contexts.keys())
          c.decrement();
        contexts.clear();
      }, false);
    }
    function read() {
      const c = SuspenseContext, v = value(), err = error();
      if (err !== void 0 && !pr)
        throw err;
      if (Listener && !Listener.user && c) {
        createComputed(() => {
          track();
          if (pr) {
            if (c.resolved)
              ;
            else if (!contexts.has(c)) {
              c.increment();
              contexts.add(c);
            }
          }
        });
      }
      return v;
    }
    function load(refetching = true) {
      if (refetching !== false && scheduled)
        return;
      scheduled = false;
      const lookup = dynamic ? dynamic() : source;
      if (lookup == null || lookup === false) {
        loadEnd(pr, untrack(value));
        return;
      }
      const p = initP !== NO_INIT ? initP : untrack(
        () => fetcher(lookup, {
          value: value(),
          refetching
        })
      );
      if (!isPromise(p)) {
        loadEnd(pr, p, void 0, lookup);
        return p;
      }
      pr = p;
      if ("value" in p) {
        if (p.status === "success")
          loadEnd(pr, p.value, void 0, lookup);
        else
          loadEnd(pr, void 0, void 0, lookup);
        return p;
      }
      scheduled = true;
      queueMicrotask(() => scheduled = false);
      runUpdates(() => {
        setState(resolved ? "refreshing" : "pending");
        trigger();
      }, false);
      return p.then(
        (v) => loadEnd(p, v, void 0, lookup),
        (e) => loadEnd(p, void 0, castError(e), lookup)
      );
    }
    Object.defineProperties(read, {
      state: {
        get: () => state()
      },
      error: {
        get: () => error()
      },
      loading: {
        get() {
          const s = state();
          return s === "pending" || s === "refreshing";
        }
      },
      latest: {
        get() {
          if (!resolved)
            return read();
          const err = error();
          if (err && !pr)
            throw err;
          return value();
        }
      }
    });
    if (dynamic)
      createComputed(() => load(false));
    else
      load(false);
    return [
      read,
      {
        refetch: load,
        mutate: setValue
      }
    ];
  }
  function batch(fn) {
    return runUpdates(fn, false);
  }
  function untrack(fn) {
    if (Listener === null)
      return fn();
    const listener = Listener;
    Listener = null;
    try {
      return fn();
    } finally {
      Listener = listener;
    }
  }
  function onMount(fn) {
    createEffect(() => untrack(fn));
  }
  function onCleanup(fn) {
    if (Owner === null)
      ;
    else if (Owner.cleanups === null)
      Owner.cleanups = [fn];
    else
      Owner.cleanups.push(fn);
    return fn;
  }
  function getListener() {
    return Listener;
  }
  function getOwner() {
    return Owner;
  }
  function runWithOwner(o, fn) {
    const prev = Owner;
    const prevListener = Listener;
    Owner = o;
    Listener = null;
    try {
      return runUpdates(fn, true);
    } catch (err) {
      handleError(err);
    } finally {
      Owner = prev;
      Listener = prevListener;
    }
  }
  function children(fn) {
    const children2 = createMemo(fn);
    const memo = createMemo(() => resolveChildren(children2()));
    memo.toArray = () => {
      const c = memo();
      return Array.isArray(c) ? c : c != null ? [c] : [];
    };
    return memo;
  }
  let SuspenseContext;
  function readSignal() {
    if (this.sources && this.state) {
      if (this.state === STALE)
        updateComputation(this);
      else {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(this), false);
        Updates = updates;
      }
    }
    if (Listener) {
      const sSlot = this.observers ? this.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!this.observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        this.observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
    return this.value;
  }
  function writeSignal(node, value, isComp) {
    let current = node.value;
    if (!node.comparator || !node.comparator(current, value)) {
      node.value = value;
      if (node.observers && node.observers.length) {
        runUpdates(() => {
          for (let i = 0; i < node.observers.length; i += 1) {
            const o = node.observers[i];
            const TransitionRunning = Transition && Transition.running;
            if (TransitionRunning && Transition.disposed.has(o))
              ;
            if (TransitionRunning ? !o.tState : !o.state) {
              if (o.pure)
                Updates.push(o);
              else
                Effects.push(o);
              if (o.observers)
                markDownstream(o);
            }
            if (!TransitionRunning)
              o.state = STALE;
          }
          if (Updates.length > 1e6) {
            Updates = [];
            if (false)
              ;
            throw new Error();
          }
        }, false);
      }
    }
    return value;
  }
  function updateComputation(node) {
    if (!node.fn)
      return;
    cleanNode(node);
    const time = ExecCount;
    runComputation(
      node,
      node.value,
      time
    );
  }
  function runComputation(node, value, time) {
    let nextValue;
    const owner = Owner, listener = Listener;
    Listener = Owner = node;
    try {
      nextValue = node.fn(value);
    } catch (err) {
      if (node.pure) {
        {
          node.state = STALE;
          node.owned && node.owned.forEach(cleanNode);
          node.owned = null;
        }
      }
      node.updatedAt = time + 1;
      return handleError(err);
    } finally {
      Listener = listener;
      Owner = owner;
    }
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.updatedAt != null && "observers" in node) {
        writeSignal(node, nextValue);
      } else
        node.value = nextValue;
      node.updatedAt = time;
    }
  }
  function createComputation(fn, init, pure, state = STALE, options) {
    const c = {
      fn,
      state,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: init,
      owner: Owner,
      context: Owner ? Owner.context : null,
      pure
    };
    if (Owner === null)
      ;
    else if (Owner !== UNOWNED) {
      {
        if (!Owner.owned)
          Owner.owned = [c];
        else
          Owner.owned.push(c);
      }
    }
    return c;
  }
  function runTop(node) {
    if (node.state === 0)
      return;
    if (node.state === PENDING)
      return lookUpstream(node);
    if (node.suspense && untrack(node.suspense.inFallback))
      return node.suspense.effects.push(node);
    const ancestors = [node];
    while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
      if (node.state)
        ancestors.push(node);
    }
    for (let i = ancestors.length - 1; i >= 0; i--) {
      node = ancestors[i];
      if (node.state === STALE) {
        updateComputation(node);
      } else if (node.state === PENDING) {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(node, ancestors[0]), false);
        Updates = updates;
      }
    }
  }
  function runUpdates(fn, init) {
    if (Updates)
      return fn();
    let wait = false;
    if (!init)
      Updates = [];
    if (Effects)
      wait = true;
    else
      Effects = [];
    ExecCount++;
    try {
      const res = fn();
      completeUpdates(wait);
      return res;
    } catch (err) {
      if (!wait)
        Effects = null;
      Updates = null;
      handleError(err);
    }
  }
  function completeUpdates(wait) {
    if (Updates) {
      runQueue(Updates);
      Updates = null;
    }
    if (wait)
      return;
    const e = Effects;
    Effects = null;
    if (e.length)
      runUpdates(() => runEffects(e), false);
  }
  function runQueue(queue) {
    for (let i = 0; i < queue.length; i++)
      runTop(queue[i]);
  }
  function runUserEffects(queue) {
    let i, userLength = 0;
    for (i = 0; i < queue.length; i++) {
      const e = queue[i];
      if (!e.user)
        runTop(e);
      else
        queue[userLength++] = e;
    }
    for (i = 0; i < userLength; i++)
      runTop(queue[i]);
  }
  function lookUpstream(node, ignore) {
    node.state = 0;
    for (let i = 0; i < node.sources.length; i += 1) {
      const source = node.sources[i];
      if (source.sources) {
        const state = source.state;
        if (state === STALE) {
          if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
            runTop(source);
        } else if (state === PENDING)
          lookUpstream(source, ignore);
      }
    }
  }
  function markDownstream(node) {
    for (let i = 0; i < node.observers.length; i += 1) {
      const o = node.observers[i];
      if (!o.state) {
        o.state = PENDING;
        if (o.pure)
          Updates.push(o);
        else
          Effects.push(o);
        o.observers && markDownstream(o);
      }
    }
  }
  function cleanNode(node) {
    let i;
    if (node.sources) {
      while (node.sources.length) {
        const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
        if (obs && obs.length) {
          const n = obs.pop(), s = source.observerSlots.pop();
          if (index < obs.length) {
            n.sourceSlots[s] = index;
            obs[index] = n;
            source.observerSlots[index] = s;
          }
        }
      }
    }
    if (node.owned) {
      for (i = node.owned.length - 1; i >= 0; i--)
        cleanNode(node.owned[i]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i = node.cleanups.length - 1; i >= 0; i--)
        node.cleanups[i]();
      node.cleanups = null;
    }
    node.state = 0;
  }
  function castError(err) {
    if (err instanceof Error)
      return err;
    return new Error(typeof err === "string" ? err : "Unknown error", {
      cause: err
    });
  }
  function handleError(err, owner = Owner) {
    const error = castError(err);
    throw error;
  }
  function resolveChildren(children2) {
    if (typeof children2 === "function" && !children2.length)
      return resolveChildren(children2());
    if (Array.isArray(children2)) {
      const results = [];
      for (let i = 0; i < children2.length; i++) {
        const result = resolveChildren(children2[i]);
        Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
      }
      return results;
    }
    return children2;
  }
  const FALLBACK = Symbol("fallback");
  function dispose(d) {
    for (let i = 0; i < d.length; i++)
      d[i]();
  }
  function mapArray(list, mapFn, options = {}) {
    let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
    onCleanup(() => dispose(disposers));
    return () => {
      let newItems = list() || [], i, j;
      newItems[$TRACK];
      return untrack(() => {
        let newLen = newItems.length, newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
        if (newLen === 0) {
          if (len !== 0) {
            dispose(disposers);
            disposers = [];
            items = [];
            mapped = [];
            len = 0;
            indexes && (indexes = []);
          }
          if (options.fallback) {
            items = [FALLBACK];
            mapped[0] = createRoot((disposer) => {
              disposers[0] = disposer;
              return options.fallback();
            });
            len = 1;
          }
        } else if (len === 0) {
          mapped = new Array(newLen);
          for (j = 0; j < newLen; j++) {
            items[j] = newItems[j];
            mapped[j] = createRoot(mapper);
          }
          len = newLen;
        } else {
          temp = new Array(newLen);
          tempdisposers = new Array(newLen);
          indexes && (tempIndexes = new Array(newLen));
          for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++)
            ;
          for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
            temp[newEnd] = mapped[end];
            tempdisposers[newEnd] = disposers[end];
            indexes && (tempIndexes[newEnd] = indexes[end]);
          }
          newIndices = /* @__PURE__ */ new Map();
          newIndicesNext = new Array(newEnd + 1);
          for (j = newEnd; j >= start; j--) {
            item = newItems[j];
            i = newIndices.get(item);
            newIndicesNext[j] = i === void 0 ? -1 : i;
            newIndices.set(item, j);
          }
          for (i = start; i <= end; i++) {
            item = items[i];
            j = newIndices.get(item);
            if (j !== void 0 && j !== -1) {
              temp[j] = mapped[i];
              tempdisposers[j] = disposers[i];
              indexes && (tempIndexes[j] = indexes[i]);
              j = newIndicesNext[j];
              newIndices.set(item, j);
            } else
              disposers[i]();
          }
          for (j = start; j < newLen; j++) {
            if (j in temp) {
              mapped[j] = temp[j];
              disposers[j] = tempdisposers[j];
              if (indexes) {
                indexes[j] = tempIndexes[j];
                indexes[j](j);
              }
            } else
              mapped[j] = createRoot(mapper);
          }
          mapped = mapped.slice(0, len = newLen);
          items = newItems.slice(0);
        }
        return mapped;
      });
      function mapper(disposer) {
        disposers[j] = disposer;
        if (indexes) {
          const [s, set] = createSignal(j);
          indexes[j] = set;
          return mapFn(newItems[j], s);
        }
        return mapFn(newItems[j]);
      }
    };
  }
  function createComponent(Comp, props) {
    return untrack(() => Comp(props || {}));
  }
  const narrowedError = (name) => `Stale read from <${name}>.`;
  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
  }
  function Switch(props) {
    let keyed = false;
    const equals = (a, b) => a[0] === b[0] && (keyed ? a[1] === b[1] : !a[1] === !b[1]) && a[2] === b[2];
    const conditions = children(() => props.children), evalConditions = createMemo(
      () => {
        let conds = conditions();
        if (!Array.isArray(conds))
          conds = [conds];
        for (let i = 0; i < conds.length; i++) {
          const c = conds[i].when;
          if (c) {
            keyed = !!conds[i].keyed;
            return [i, c, conds[i]];
          }
        }
        return [-1];
      },
      void 0,
      {
        equals
      }
    );
    return createMemo(
      () => {
        const [index, when, cond] = evalConditions();
        if (index < 0)
          return props.fallback;
        const c = cond.children;
        const fn = typeof c === "function" && c.length > 0;
        return fn ? untrack(
          () => c(
            keyed ? when : () => {
              if (untrack(evalConditions)[0] !== index)
                throw narrowedError("Match");
              return cond.when;
            }
          )
        ) : c;
      },
      void 0,
      void 0
    );
  }
  function Match(props) {
    return props;
  }
  function reconcileArrays(parentNode, a, b) {
    let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
    while (aStart < aEnd || bStart < bEnd) {
      if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
        continue;
      }
      while (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
      if (aEnd === aStart) {
        const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
        while (bStart < bEnd)
          parentNode.insertBefore(b[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart]))
            a[aStart].remove();
          aStart++;
        }
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = a[--aEnd].nextSibling;
        parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
        parentNode.insertBefore(b[--bEnd], node);
        a[aEnd] = b[bEnd];
      } else {
        if (!map) {
          map = /* @__PURE__ */ new Map();
          let i = bStart;
          while (i < bEnd)
            map.set(b[i], i++);
        }
        const index = map.get(a[aStart]);
        if (index != null) {
          if (bStart < index && index < bEnd) {
            let i = aStart, sequence = 1, t;
            while (++i < aEnd && i < bEnd) {
              if ((t = map.get(a[i])) == null || t !== index + sequence)
                break;
              sequence++;
            }
            if (sequence > index - bStart) {
              const node = a[aStart];
              while (bStart < index)
                parentNode.insertBefore(b[bStart++], node);
            } else
              parentNode.replaceChild(b[bStart++], a[aStart++]);
          } else
            aStart++;
        } else
          a[aStart++].remove();
      }
    }
  }
  const $$EVENTS = "_$DX_DELEGATE";
  function render(code, element, init, options = {}) {
    let disposer;
    createRoot((dispose2) => {
      disposer = dispose2;
      element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
    }, options.owner);
    return () => {
      disposer();
      element.textContent = "";
    };
  }
  function template(html, isCE, isSVG) {
    let node;
    const create = () => {
      const t = document.createElement("template");
      t.innerHTML = html;
      return isSVG ? t.content.firstChild.firstChild : t.content.firstChild;
    };
    const fn = isCE ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
    fn.cloneNode = fn;
    return fn;
  }
  function delegateEvents(eventNames, document2 = window.document) {
    const e = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
    for (let i = 0, l = eventNames.length; i < l; i++) {
      const name = eventNames[i];
      if (!e.has(name)) {
        e.add(name);
        document2.addEventListener(name, eventHandler);
      }
    }
  }
  function insert(parent, accessor, marker, initial) {
    if (marker !== void 0 && !initial)
      initial = [];
    if (typeof accessor !== "function")
      return insertExpression(parent, accessor, initial, marker);
    createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
  }
  function eventHandler(e) {
    const key = `$$${e.type}`;
    let node = e.composedPath && e.composedPath()[0] || e.target;
    if (e.target !== node) {
      Object.defineProperty(e, "target", {
        configurable: true,
        value: node
      });
    }
    Object.defineProperty(e, "currentTarget", {
      configurable: true,
      get() {
        return node || document;
      }
    });
    while (node) {
      const handler = node[key];
      if (handler && !node.disabled) {
        const data = node[`${key}Data`];
        data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
        if (e.cancelBubble)
          return;
      }
      node = node._$host || node.parentNode || node.host;
    }
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    while (typeof current === "function")
      current = current();
    if (value === current)
      return current;
    const t = typeof value, multi = marker !== void 0;
    parent = multi && current[0] && current[0].parentNode || parent;
    if (t === "string" || t === "number") {
      if (t === "number")
        value = value.toString();
      if (multi) {
        let node = current[0];
        if (node && node.nodeType === 3) {
          node.data = value;
        } else
          node = document.createTextNode(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else
          current = parent.textContent = value;
      }
    } else if (value == null || t === "boolean") {
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      createRenderEffect(() => {
        let v = value();
        while (typeof v === "function")
          v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array2 = [];
      const currentArray = current && Array.isArray(current);
      if (normalizeIncomingArray(array2, value, current, unwrapArray)) {
        createRenderEffect(() => current = insertExpression(parent, array2, current, marker, true));
        return () => current;
      }
      if (array2.length === 0) {
        current = cleanChildren(parent, current, marker);
        if (multi)
          return current;
      } else if (currentArray) {
        if (current.length === 0) {
          appendNodes(parent, array2, marker);
        } else
          reconcileArrays(parent, current, array2);
      } else {
        current && cleanChildren(parent);
        appendNodes(parent, array2);
      }
      current = array2;
    } else if (value.nodeType) {
      if (Array.isArray(current)) {
        if (multi)
          return current = cleanChildren(parent, current, marker, value);
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else
        parent.replaceChild(value, parent.firstChild);
      current = value;
    } else
      ;
    return current;
  }
  function normalizeIncomingArray(normalized, array2, current, unwrap2) {
    let dynamic = false;
    for (let i = 0, len = array2.length; i < len; i++) {
      let item = array2[i], prev = current && current[i], t;
      if (item == null || item === true || item === false)
        ;
      else if ((t = typeof item) === "object" && item.nodeType) {
        normalized.push(item);
      } else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (t === "function") {
        if (unwrap2) {
          while (typeof item === "function")
            item = item();
          dynamic = normalizeIncomingArray(
            normalized,
            Array.isArray(item) ? item : [item],
            Array.isArray(prev) ? prev : [prev]
          ) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else {
        const value = String(item);
        if (prev && prev.nodeType === 3 && prev.data === value)
          normalized.push(prev);
        else
          normalized.push(document.createTextNode(value));
      }
    }
    return dynamic;
  }
  function appendNodes(parent, array2, marker = null) {
    for (let i = 0, len = array2.length; i < len; i++)
      parent.insertBefore(array2[i], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === void 0)
      return parent.textContent = "";
    const node = replacement || document.createTextNode("");
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i)
            isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
          else
            isParent && el.remove();
        } else
          inserted = true;
      }
    } else
      parent.insertBefore(node, marker);
    return [node];
  }
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  function createElement(tagName, isSVG = false) {
    return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
  }
  function Portal(props) {
    const { useShadow } = props, marker = document.createTextNode(""), mount = () => props.mount || document.body, owner = getOwner();
    let content;
    let hydrating = !!sharedConfig.context;
    createEffect(
      () => {
        content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
        const el = mount();
        if (el instanceof HTMLHeadElement) {
          const [clean, setClean] = createSignal(false);
          const cleanup = () => setClean(true);
          createRoot((dispose2) => insert(el, () => !clean() ? content() : dispose2(), null));
          onCleanup(cleanup);
        } else {
          const container = createElement(props.isSVG ? "g" : "div", props.isSVG), renderRoot = useShadow && container.attachShadow ? container.attachShadow({
            mode: "open"
          }) : container;
          Object.defineProperty(container, "_$host", {
            get() {
              return marker.parentNode;
            },
            configurable: true
          });
          insert(renderRoot, content);
          el.appendChild(container);
          props.ref && props.ref(container);
          onCleanup(() => el.removeChild(container));
        }
      },
      void 0,
      {
        render: !hydrating
      }
    );
    return marker;
  }
  const $RAW = Symbol("store-raw"), $NODE = Symbol("store-node"), $HAS = Symbol("store-has"), $SELF = Symbol("store-self");
  function wrap$1(value) {
    let p = value[$PROXY];
    if (!p) {
      Object.defineProperty(value, $PROXY, {
        value: p = new Proxy(value, proxyTraps$1)
      });
      if (!Array.isArray(value)) {
        const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
        for (let i = 0, l = keys.length; i < l; i++) {
          const prop = keys[i];
          if (desc[prop].get) {
            Object.defineProperty(value, prop, {
              enumerable: desc[prop].enumerable,
              get: desc[prop].get.bind(p)
            });
          }
        }
      }
    }
    return p;
  }
  function isWrappable(obj) {
    let proto;
    return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item, set = /* @__PURE__ */ new Set()) {
    let result, unwrapped, v, prop;
    if (result = item != null && item[$RAW])
      return result;
    if (!isWrappable(item) || set.has(item))
      return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item))
        item = item.slice(0);
      else
        set.add(item);
      for (let i = 0, l = item.length; i < l; i++) {
        v = item[i];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[i] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item))
        item = Object.assign({}, item);
      else
        set.add(item);
      const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
      for (let i = 0, l = keys.length; i < l; i++) {
        prop = keys[i];
        if (desc[prop].get)
          continue;
        v = item[prop];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[prop] = unwrapped;
      }
    }
    return item;
  }
  function getNodes(target, symbol) {
    let nodes = target[symbol];
    if (!nodes)
      Object.defineProperty(target, symbol, {
        value: nodes = /* @__PURE__ */ Object.create(null)
      });
    return nodes;
  }
  function getNode(nodes, property, value) {
    if (nodes[property])
      return nodes[property];
    const [s, set] = createSignal(value, {
      equals: false,
      internal: true
    });
    s.$ = set;
    return nodes[property] = s;
  }
  function proxyDescriptor$1(target, property) {
    const desc = Reflect.getOwnPropertyDescriptor(target, property);
    if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE)
      return desc;
    delete desc.value;
    delete desc.writable;
    desc.get = () => target[$PROXY][property];
    return desc;
  }
  function trackSelf(target) {
    getListener() && getNode(getNodes(target, $NODE), $SELF)();
  }
  function ownKeys(target) {
    trackSelf(target);
    return Reflect.ownKeys(target);
  }
  const proxyTraps$1 = {
    get(target, property, receiver) {
      if (property === $RAW)
        return target;
      if (property === $PROXY)
        return receiver;
      if (property === $TRACK) {
        trackSelf(target);
        return receiver;
      }
      const nodes = getNodes(target, $NODE);
      const tracked = nodes[property];
      let value = tracked ? tracked() : target[property];
      if (property === $NODE || property === $HAS || property === "__proto__")
        return value;
      if (!tracked) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
          value = getNode(nodes, property, value)();
      }
      return isWrappable(value) ? wrap$1(value) : value;
    },
    has(target, property) {
      if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === $HAS || property === "__proto__")
        return true;
      getListener() && getNode(getNodes(target, $HAS), property)();
      return property in target;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    ownKeys,
    getOwnPropertyDescriptor: proxyDescriptor$1
  };
  function setProperty(state, property, value, deleting = false) {
    if (!deleting && state[property] === value)
      return;
    const prev = state[property], len = state.length;
    if (value === void 0) {
      delete state[property];
      if (state[$HAS] && state[$HAS][property] && prev !== void 0)
        state[$HAS][property].$();
    } else {
      state[property] = value;
      if (state[$HAS] && state[$HAS][property] && prev === void 0)
        state[$HAS][property].$();
    }
    let nodes = getNodes(state, $NODE), node;
    if (node = getNode(nodes, property, prev))
      node.$(() => value);
    if (Array.isArray(state) && state.length !== len) {
      for (let i = state.length; i < len; i++)
        (node = nodes[i]) && node.$();
      (node = getNode(nodes, "length", len)) && node.$(state.length);
    }
    (node = nodes[$SELF]) && node.$();
  }
  function mergeStoreNode(state, value) {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      setProperty(state, key, value[key]);
    }
  }
  function updateArray(current, next) {
    if (typeof next === "function")
      next = next(current);
    next = unwrap(next);
    if (Array.isArray(next)) {
      if (current === next)
        return;
      let i = 0, len = next.length;
      for (; i < len; i++) {
        const value = next[i];
        if (current[i] !== value)
          setProperty(current, i, value);
      }
      setProperty(current, "length", len);
    } else
      mergeStoreNode(current, next);
  }
  function updatePath(current, path, traversed = []) {
    let part, prev = current;
    if (path.length > 1) {
      part = path.shift();
      const partType = typeof part, isArray = Array.isArray(current);
      if (Array.isArray(part)) {
        for (let i = 0; i < part.length; i++) {
          updatePath(current, [part[i]].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i = 0; i < current.length; i++) {
          if (part(current[i], i))
            updatePath(current, [i].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "object") {
        const { from = 0, to = current.length - 1, by = 1 } = part;
        for (let i = from; i <= to; i += by) {
          updatePath(current, [i].concat(path), traversed);
        }
        return;
      } else if (path.length > 1) {
        updatePath(current[part], path, [part].concat(traversed));
        return;
      }
      prev = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      value = value(prev, traversed);
      if (value === prev)
        return;
    }
    if (part === void 0 && value == void 0)
      return;
    value = unwrap(value);
    if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
      mergeStoreNode(prev, value);
    } else
      setProperty(current, part, value);
  }
  function createStore(...[store, options]) {
    const unwrappedStore = unwrap(store || {});
    const isArray = Array.isArray(unwrappedStore);
    const wrappedStore = wrap$1(unwrappedStore);
    function setStore(...args) {
      batch(() => {
        isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
      });
    }
    return [wrappedStore, setStore];
  }
  const useSongInfo = () => {
    const [songInfo, setSongInfo] = createStore({});
    let observer;
    onMount(() => {
      const songInfoElement = document.querySelector(
        ".ytmusic-player-bar .content-info-wrapper"
      );
      if (!songInfoElement) {
        return;
      }
      observer = new MutationObserver(() => {
        var _a;
        const title = (_a = songInfoElement.querySelector(".title")) == null ? void 0 : _a.textContent;
        if (!title) {
          return;
        }
        const info = songInfoElement.querySelectorAll(".byline a");
        let artist = [];
        let album = void 0;
        info.forEach((element, index) => {
          const href = element.getAttribute("href");
          if (!href) {
            return;
          }
          if (/.*channel\/.+/g.test(href)) {
            if (element.textContent) {
              artist.push(element.textContent);
            }
          } else if (/.*browse\/.+/g.test(href)) {
            if (element.textContent) {
              album = element.textContent;
            }
          }
        });
        setSongInfo("data", {
          title,
          artist,
          album
        });
      });
      observer.observe(songInfoElement, {
        childList: true,
        subtree: true
      });
    });
    onCleanup(() => {
      observer == null ? void 0 : observer.disconnect();
    });
    return songInfo;
  };
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var validator$2 = {};
  var util$3 = {};
  (function(exports) {
    const nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    const nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    const nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    const regexName = new RegExp("^" + nameRegexp + "$");
    const getAllMatches = function(string2, regex) {
      const matches = [];
      let match = regex.exec(string2);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string2);
      }
      return matches;
    };
    const isName = function(string2) {
      const match = regexName.exec(string2);
      return !(match === null || typeof match === "undefined");
    };
    exports.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
  })(util$3);
  const util$2 = util$3;
  const defaultOptions$2 = {
    allowBooleanAttributes: false,
    //A tag can have attributes without any value
    unpairedTags: []
  };
  validator$2.validate = function(xmlData, options) {
    options = Object.assign({}, defaultOptions$2, options);
    const tags = [];
    let tagFound = false;
    let reachedRoot = false;
    if (xmlData[0] === "\uFEFF") {
      xmlData = xmlData.substr(1);
    }
    for (let i = 0; i < xmlData.length; i++) {
      if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
        i += 2;
        i = readPI(xmlData, i);
        if (i.err)
          return i;
      } else if (xmlData[i] === "<") {
        let tagStartPos = i;
        i++;
        if (xmlData[i] === "!") {
          i = readCommentAndCDATA(xmlData, i);
          continue;
        } else {
          let closingTag = false;
          if (xmlData[i] === "/") {
            closingTag = true;
            i++;
          }
          let tagName = "";
          for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
            tagName += xmlData[i];
          }
          tagName = tagName.trim();
          if (tagName[tagName.length - 1] === "/") {
            tagName = tagName.substring(0, tagName.length - 1);
            i--;
          }
          if (!validateTagName(tagName)) {
            let msg;
            if (tagName.trim().length === 0) {
              msg = "Invalid space after '<'.";
            } else {
              msg = "Tag '" + tagName + "' is an invalid name.";
            }
            return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
          }
          const result = readAttributeStr(xmlData, i);
          if (result === false) {
            return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
          }
          let attrStr = result.value;
          i = result.index;
          if (attrStr[attrStr.length - 1] === "/") {
            const attrStrStart = i - attrStr.length;
            attrStr = attrStr.substring(0, attrStr.length - 1);
            const isValid = validateAttributeString(attrStr, options);
            if (isValid === true) {
              tagFound = true;
            } else {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
            }
          } else if (closingTag) {
            if (!result.tagClosed) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
            } else if (attrStr.trim().length > 0) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
            } else {
              const otg = tags.pop();
              if (tagName !== otg.tagName) {
                let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                return getErrorObject(
                  "InvalidTag",
                  "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                  getLineNumberForPosition(xmlData, tagStartPos)
                );
              }
              if (tags.length == 0) {
                reachedRoot = true;
              }
            }
          } else {
            const isValid = validateAttributeString(attrStr, options);
            if (isValid !== true) {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
            }
            if (reachedRoot === true) {
              return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
            } else if (options.unpairedTags.indexOf(tagName) !== -1)
              ;
            else {
              tags.push({ tagName, tagStartPos });
            }
            tagFound = true;
          }
          for (i++; i < xmlData.length; i++) {
            if (xmlData[i] === "<") {
              if (xmlData[i + 1] === "!") {
                i++;
                i = readCommentAndCDATA(xmlData, i);
                continue;
              } else if (xmlData[i + 1] === "?") {
                i = readPI(xmlData, ++i);
                if (i.err)
                  return i;
              } else {
                break;
              }
            } else if (xmlData[i] === "&") {
              const afterAmp = validateAmpersand(xmlData, i);
              if (afterAmp == -1)
                return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
              i = afterAmp;
            } else {
              if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
              }
            }
          }
          if (xmlData[i] === "<") {
            i--;
          }
        }
      } else {
        if (isWhiteSpace(xmlData[i])) {
          continue;
        }
        return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
      }
    }
    if (!tagFound) {
      return getErrorObject("InvalidXml", "Start tag expected.", 1);
    } else if (tags.length == 1) {
      return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
    } else if (tags.length > 0) {
      return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
    }
    return true;
  };
  function isWhiteSpace(char) {
    return char === " " || char === "	" || char === "\n" || char === "\r";
  }
  function readPI(xmlData, i) {
    const start = i;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] == "?" || xmlData[i] == " ") {
        const tagname = xmlData.substr(start, i - start);
        if (i > 5 && tagname === "xml") {
          return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
        } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
          i++;
          break;
        } else {
          continue;
        }
      }
    }
    return i;
  }
  function readCommentAndCDATA(xmlData, i) {
    if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
      for (i += 3; i < xmlData.length; i++) {
        if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
      let angleBracketsCount = 1;
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          angleBracketsCount++;
        } else if (xmlData[i] === ">") {
          angleBracketsCount--;
          if (angleBracketsCount === 0) {
            break;
          }
        }
      }
    } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    }
    return i;
  }
  const doubleQuote = '"';
  const singleQuote = "'";
  function readAttributeStr(xmlData, i) {
    let attrStr = "";
    let startChar = "";
    let tagClosed = false;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
        if (startChar === "") {
          startChar = xmlData[i];
        } else if (startChar !== xmlData[i])
          ;
        else {
          startChar = "";
        }
      } else if (xmlData[i] === ">") {
        if (startChar === "") {
          tagClosed = true;
          break;
        }
      }
      attrStr += xmlData[i];
    }
    if (startChar !== "") {
      return false;
    }
    return {
      value: attrStr,
      index: i,
      tagClosed
    };
  }
  const validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
  function validateAttributeString(attrStr, options) {
    const matches = util$2.getAllMatches(attrStr, validAttrStrRegxp);
    const attrNames = {};
    for (let i = 0; i < matches.length; i++) {
      if (matches[i][1].length === 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
      } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
      } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
        return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
      }
      const attrName = matches[i][2];
      if (!validateAttrName(attrName)) {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
      }
      if (!attrNames.hasOwnProperty(attrName)) {
        attrNames[attrName] = 1;
      } else {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
      }
    }
    return true;
  }
  function validateNumberAmpersand(xmlData, i) {
    let re = /\d/;
    if (xmlData[i] === "x") {
      i++;
      re = /[\da-fA-F]/;
    }
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === ";")
        return i;
      if (!xmlData[i].match(re))
        break;
    }
    return -1;
  }
  function validateAmpersand(xmlData, i) {
    i++;
    if (xmlData[i] === ";")
      return -1;
    if (xmlData[i] === "#") {
      i++;
      return validateNumberAmpersand(xmlData, i);
    }
    let count2 = 0;
    for (; i < xmlData.length; i++, count2++) {
      if (xmlData[i].match(/\w/) && count2 < 20)
        continue;
      if (xmlData[i] === ";")
        break;
      return -1;
    }
    return i;
  }
  function getErrorObject(code, message, lineNumber) {
    return {
      err: {
        code,
        msg: message,
        line: lineNumber.line || lineNumber,
        col: lineNumber.col
      }
    };
  }
  function validateAttrName(attrName) {
    return util$2.isName(attrName);
  }
  function validateTagName(tagname) {
    return util$2.isName(tagname);
  }
  function getLineNumberForPosition(xmlData, index) {
    const lines = xmlData.substring(0, index).split(/\r?\n/);
    return {
      line: lines.length,
      // column number is last line's length + 1, because column numbering starts at 1:
      col: lines[lines.length - 1].length + 1
    };
  }
  function getPositionFromMatch(match) {
    return match.startIndex + match[1].length;
  }
  var OptionsBuilder = {};
  const defaultOptions$1 = {
    preserveOrder: false,
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    removeNSPrefix: false,
    // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false,
    //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true,
    //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true
    },
    tagValueProcessor: function(tagName, val2) {
      return val2;
    },
    attributeValueProcessor: function(attrName, val2) {
      return val2;
    },
    stopNodes: [],
    //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs) {
      return tagName;
    }
    // skipEmptyListItem: false
  };
  const buildOptions$1 = function(options) {
    return Object.assign({}, defaultOptions$1, options);
  };
  OptionsBuilder.buildOptions = buildOptions$1;
  OptionsBuilder.defaultOptions = defaultOptions$1;
  class XmlNode {
    constructor(tagname) {
      this.tagname = tagname;
      this.child = [];
      this[":@"] = {};
    }
    add(key, val2) {
      if (key === "__proto__")
        key = "#__proto__";
      this.child.push({ [key]: val2 });
    }
    addChild(node) {
      if (node.tagname === "__proto__")
        node.tagname = "#__proto__";
      if (node[":@"] && Object.keys(node[":@"]).length > 0) {
        this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
      } else {
        this.child.push({ [node.tagname]: node.child });
      }
    }
  }
  var xmlNode$1 = XmlNode;
  const util$1 = util$3;
  function readDocType$1(xmlData, i) {
    const entities = {};
    if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
      i = i + 9;
      let angleBracketsCount = 1;
      let hasBody = false, comment = false;
      let exp = "";
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && !comment) {
          if (hasBody && isEntity(xmlData, i)) {
            i += 7;
            [entityName, val, i] = readEntityExp(xmlData, i + 1);
            if (val.indexOf("&") === -1)
              entities[validateEntityName(entityName)] = {
                regx: RegExp(`&${entityName};`, "g"),
                val
              };
          } else if (hasBody && isElement(xmlData, i))
            i += 8;
          else if (hasBody && isAttlist(xmlData, i))
            i += 8;
          else if (hasBody && isNotation(xmlData, i))
            i += 9;
          else if (isComment)
            comment = true;
          else
            throw new Error("Invalid DOCTYPE");
          angleBracketsCount++;
          exp = "";
        } else if (xmlData[i] === ">") {
          if (comment) {
            if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
              comment = false;
              angleBracketsCount--;
            }
          } else {
            angleBracketsCount--;
          }
          if (angleBracketsCount === 0) {
            break;
          }
        } else if (xmlData[i] === "[") {
          hasBody = true;
        } else {
          exp += xmlData[i];
        }
      }
      if (angleBracketsCount !== 0) {
        throw new Error(`Unclosed DOCTYPE`);
      }
    } else {
      throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return { entities, i };
  }
  function readEntityExp(xmlData, i) {
    let entityName2 = "";
    for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"'); i++) {
      entityName2 += xmlData[i];
    }
    entityName2 = entityName2.trim();
    if (entityName2.indexOf(" ") !== -1)
      throw new Error("External entites are not supported");
    const startChar = xmlData[i++];
    let val2 = "";
    for (; i < xmlData.length && xmlData[i] !== startChar; i++) {
      val2 += xmlData[i];
    }
    return [entityName2, val2, i];
  }
  function isComment(xmlData, i) {
    if (xmlData[i + 1] === "!" && xmlData[i + 2] === "-" && xmlData[i + 3] === "-")
      return true;
    return false;
  }
  function isEntity(xmlData, i) {
    if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "N" && xmlData[i + 4] === "T" && xmlData[i + 5] === "I" && xmlData[i + 6] === "T" && xmlData[i + 7] === "Y")
      return true;
    return false;
  }
  function isElement(xmlData, i) {
    if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "L" && xmlData[i + 4] === "E" && xmlData[i + 5] === "M" && xmlData[i + 6] === "E" && xmlData[i + 7] === "N" && xmlData[i + 8] === "T")
      return true;
    return false;
  }
  function isAttlist(xmlData, i) {
    if (xmlData[i + 1] === "!" && xmlData[i + 2] === "A" && xmlData[i + 3] === "T" && xmlData[i + 4] === "T" && xmlData[i + 5] === "L" && xmlData[i + 6] === "I" && xmlData[i + 7] === "S" && xmlData[i + 8] === "T")
      return true;
    return false;
  }
  function isNotation(xmlData, i) {
    if (xmlData[i + 1] === "!" && xmlData[i + 2] === "N" && xmlData[i + 3] === "O" && xmlData[i + 4] === "T" && xmlData[i + 5] === "A" && xmlData[i + 6] === "T" && xmlData[i + 7] === "I" && xmlData[i + 8] === "O" && xmlData[i + 9] === "N")
      return true;
    return false;
  }
  function validateEntityName(name) {
    if (util$1.isName(name))
      return name;
    else
      throw new Error(`Invalid entity name ${name}`);
  }
  var DocTypeReader = readDocType$1;
  const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
  const numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
  if (!Number.parseInt && window.parseInt) {
    Number.parseInt = window.parseInt;
  }
  if (!Number.parseFloat && window.parseFloat) {
    Number.parseFloat = window.parseFloat;
  }
  const consider = {
    hex: true,
    leadingZeros: true,
    decimalPoint: ".",
    eNotation: true
    //skipLike: /regex/
  };
  function toNumber$1(str, options = {}) {
    options = Object.assign({}, consider, options);
    if (!str || typeof str !== "string")
      return str;
    let trimmedStr = str.trim();
    if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr))
      return str;
    else if (options.hex && hexRegex.test(trimmedStr)) {
      return Number.parseInt(trimmedStr, 16);
    } else {
      const match = numRegex.exec(trimmedStr);
      if (match) {
        const sign = match[1];
        const leadingZeros = match[2];
        let numTrimmedByZeros = trimZeros(match[3]);
        const eNotation = match[4] || match[6];
        if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".")
          return str;
        else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".")
          return str;
        else {
          const num = Number(trimmedStr);
          const numStr = "" + num;
          if (numStr.search(/[eE]/) !== -1) {
            if (options.eNotation)
              return num;
            else
              return str;
          } else if (eNotation) {
            if (options.eNotation)
              return num;
            else
              return str;
          } else if (trimmedStr.indexOf(".") !== -1) {
            if (numStr === "0" && numTrimmedByZeros === "")
              return num;
            else if (numStr === numTrimmedByZeros)
              return num;
            else if (sign && numStr === "-" + numTrimmedByZeros)
              return num;
            else
              return str;
          }
          if (leadingZeros) {
            if (numTrimmedByZeros === numStr)
              return num;
            else if (sign + numTrimmedByZeros === numStr)
              return num;
            else
              return str;
          }
          if (trimmedStr === numStr)
            return num;
          else if (trimmedStr === sign + numStr)
            return num;
          return str;
        }
      } else {
        return str;
      }
    }
  }
  function trimZeros(numStr) {
    if (numStr && numStr.indexOf(".") !== -1) {
      numStr = numStr.replace(/0+$/, "");
      if (numStr === ".")
        numStr = "0";
      else if (numStr[0] === ".")
        numStr = "0" + numStr;
      else if (numStr[numStr.length - 1] === ".")
        numStr = numStr.substr(0, numStr.length - 1);
      return numStr;
    }
    return numStr;
  }
  var strnum = toNumber$1;
  const util = util$3;
  const xmlNode = xmlNode$1;
  const readDocType = DocTypeReader;
  const toNumber = strnum;
  "<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)".replace(/NAME/g, util.nameRegexp);
  let OrderedObjParser$1 = class OrderedObjParser {
    constructor(options) {
      this.options = options;
      this.currentNode = null;
      this.tagsNodeStack = [];
      this.docTypeEntities = {};
      this.lastEntities = {
        "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
        "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
        "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
        "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
      };
      this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
      this.htmlEntities = {
        "space": { regex: /&(nbsp|#160);/g, val: " " },
        // "lt" : { regex: /&(lt|#60);/g, val: "<" },
        // "gt" : { regex: /&(gt|#62);/g, val: ">" },
        // "amp" : { regex: /&(amp|#38);/g, val: "&" },
        // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
        // "apos" : { regex: /&(apos|#39);/g, val: "'" },
        "cent": { regex: /&(cent|#162);/g, val: "¢" },
        "pound": { regex: /&(pound|#163);/g, val: "£" },
        "yen": { regex: /&(yen|#165);/g, val: "¥" },
        "euro": { regex: /&(euro|#8364);/g, val: "€" },
        "copyright": { regex: /&(copy|#169);/g, val: "©" },
        "reg": { regex: /&(reg|#174);/g, val: "®" },
        "inr": { regex: /&(inr|#8377);/g, val: "₹" }
      };
      this.addExternalEntities = addExternalEntities;
      this.parseXml = parseXml;
      this.parseTextData = parseTextData;
      this.resolveNameSpace = resolveNameSpace;
      this.buildAttributesMap = buildAttributesMap;
      this.isItStopNode = isItStopNode;
      this.replaceEntitiesValue = replaceEntitiesValue$1;
      this.readStopNodeData = readStopNodeData;
      this.saveTextToParentTag = saveTextToParentTag;
      this.addChild = addChild;
    }
  };
  function addExternalEntities(externalEntities) {
    const entKeys = Object.keys(externalEntities);
    for (let i = 0; i < entKeys.length; i++) {
      const ent = entKeys[i];
      this.lastEntities[ent] = {
        regex: new RegExp("&" + ent + ";", "g"),
        val: externalEntities[ent]
      };
    }
  }
  function parseTextData(val2, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
    if (val2 !== void 0) {
      if (this.options.trimValues && !dontTrim) {
        val2 = val2.trim();
      }
      if (val2.length > 0) {
        if (!escapeEntities)
          val2 = this.replaceEntitiesValue(val2);
        const newval = this.options.tagValueProcessor(tagName, val2, jPath, hasAttributes, isLeafNode);
        if (newval === null || newval === void 0) {
          return val2;
        } else if (typeof newval !== typeof val2 || newval !== val2) {
          return newval;
        } else if (this.options.trimValues) {
          return parseValue(val2, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          const trimmedVal = val2.trim();
          if (trimmedVal === val2) {
            return parseValue(val2, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            return val2;
          }
        }
      }
    }
  }
  function resolveNameSpace(tagname) {
    if (this.options.removeNSPrefix) {
      const tags = tagname.split(":");
      const prefix = tagname.charAt(0) === "/" ? "/" : "";
      if (tags[0] === "xmlns") {
        return "";
      }
      if (tags.length === 2) {
        tagname = prefix + tags[1];
      }
    }
    return tagname;
  }
  const attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
  function buildAttributesMap(attrStr, jPath, tagName) {
    if (!this.options.ignoreAttributes && typeof attrStr === "string") {
      const matches = util.getAllMatches(attrStr, attrsRegx);
      const len = matches.length;
      const attrs = {};
      for (let i = 0; i < len; i++) {
        const attrName = this.resolveNameSpace(matches[i][1]);
        let oldVal = matches[i][4];
        let aName = this.options.attributeNamePrefix + attrName;
        if (attrName.length) {
          if (this.options.transformAttributeName) {
            aName = this.options.transformAttributeName(aName);
          }
          if (aName === "__proto__")
            aName = "#__proto__";
          if (oldVal !== void 0) {
            if (this.options.trimValues) {
              oldVal = oldVal.trim();
            }
            oldVal = this.replaceEntitiesValue(oldVal);
            const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
            if (newVal === null || newVal === void 0) {
              attrs[aName] = oldVal;
            } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
              attrs[aName] = newVal;
            } else {
              attrs[aName] = parseValue(
                oldVal,
                this.options.parseAttributeValue,
                this.options.numberParseOptions
              );
            }
          } else if (this.options.allowBooleanAttributes) {
            attrs[aName] = true;
          }
        }
      }
      if (!Object.keys(attrs).length) {
        return;
      }
      if (this.options.attributesGroupName) {
        const attrCollection = {};
        attrCollection[this.options.attributesGroupName] = attrs;
        return attrCollection;
      }
      return attrs;
    }
  }
  const parseXml = function(xmlData) {
    xmlData = xmlData.replace(/\r\n?/g, "\n");
    const xmlObj = new xmlNode("!xml");
    let currentNode = xmlObj;
    let textData = "";
    let jPath = "";
    for (let i = 0; i < xmlData.length; i++) {
      const ch = xmlData[i];
      if (ch === "<") {
        if (xmlData[i + 1] === "/") {
          const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
          let tagName = xmlData.substring(i + 2, closeIndex).trim();
          if (this.options.removeNSPrefix) {
            const colonIndex = tagName.indexOf(":");
            if (colonIndex !== -1) {
              tagName = tagName.substr(colonIndex + 1);
            }
          }
          if (this.options.transformTagName) {
            tagName = this.options.transformTagName(tagName);
          }
          if (currentNode) {
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
          }
          const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
          if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
            throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
          }
          let propIndex = 0;
          if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
            propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
            this.tagsNodeStack.pop();
          } else {
            propIndex = jPath.lastIndexOf(".");
          }
          jPath = jPath.substring(0, propIndex);
          currentNode = this.tagsNodeStack.pop();
          textData = "";
          i = closeIndex;
        } else if (xmlData[i + 1] === "?") {
          let tagData = readTagExp(xmlData, i, false, "?>");
          if (!tagData)
            throw new Error("Pi Tag is not closed.");
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags)
            ;
          else {
            const childNode = new xmlNode(tagData.tagName);
            childNode.add(this.options.textNodeName, "");
            if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
            }
            this.addChild(currentNode, childNode, jPath);
          }
          i = tagData.closeIndex + 1;
        } else if (xmlData.substr(i + 1, 3) === "!--") {
          const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
          if (this.options.commentPropName) {
            const comment = xmlData.substring(i + 4, endIndex - 2);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
          }
          i = endIndex;
        } else if (xmlData.substr(i + 1, 2) === "!D") {
          const result = readDocType(xmlData, i);
          this.docTypeEntities = result.entities;
          i = result.i;
        } else if (xmlData.substr(i + 1, 2) === "![") {
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
          const tagExp = xmlData.substring(i + 9, closeIndex);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          if (this.options.cdataPropName) {
            currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
          } else {
            let val2 = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true);
            if (val2 == void 0)
              val2 = "";
            currentNode.add(this.options.textNodeName, val2);
          }
          i = closeIndex + 2;
        } else {
          let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
          let tagName = result.tagName;
          const rawTagName = result.rawTagName;
          let tagExp = result.tagExp;
          let attrExpPresent = result.attrExpPresent;
          let closeIndex = result.closeIndex;
          if (this.options.transformTagName) {
            tagName = this.options.transformTagName(tagName);
          }
          if (currentNode && textData) {
            if (currentNode.tagname !== "!xml") {
              textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
            }
          }
          const lastTag = currentNode;
          if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
            currentNode = this.tagsNodeStack.pop();
            jPath = jPath.substring(0, jPath.lastIndexOf("."));
          }
          if (tagName !== xmlObj.tagname) {
            jPath += jPath ? "." + tagName : tagName;
          }
          if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
            let tagContent = "";
            if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
              i = result.closeIndex;
            } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
              i = result.closeIndex;
            } else {
              const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
              if (!result2)
                throw new Error(`Unexpected end of ${rawTagName}`);
              i = result2.i;
              tagContent = result2.tagContent;
            }
            const childNode = new xmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            if (tagContent) {
              tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
            }
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
            childNode.add(this.options.textNodeName, tagContent);
            this.addChild(currentNode, childNode, jPath);
          } else {
            if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
              if (tagName[tagName.length - 1] === "/") {
                tagName = tagName.substr(0, tagName.length - 1);
                jPath = jPath.substr(0, jPath.length - 1);
                tagExp = tagName;
              } else {
                tagExp = tagExp.substr(0, tagExp.length - 1);
              }
              if (this.options.transformTagName) {
                tagName = this.options.transformTagName(tagName);
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              this.addChild(currentNode, childNode, jPath);
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
            } else {
              const childNode = new xmlNode(tagName);
              this.tagsNodeStack.push(currentNode);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              this.addChild(currentNode, childNode, jPath);
              currentNode = childNode;
            }
            textData = "";
            i = closeIndex;
          }
        }
      } else {
        textData += xmlData[i];
      }
    }
    return xmlObj.child;
  };
  function addChild(currentNode, childNode, jPath) {
    const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
    if (result === false)
      ;
    else if (typeof result === "string") {
      childNode.tagname = result;
      currentNode.addChild(childNode);
    } else {
      currentNode.addChild(childNode);
    }
  }
  const replaceEntitiesValue$1 = function(val2) {
    if (this.options.processEntities) {
      for (let entityName2 in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName2];
        val2 = val2.replace(entity.regx, entity.val);
      }
      for (let entityName2 in this.lastEntities) {
        const entity = this.lastEntities[entityName2];
        val2 = val2.replace(entity.regex, entity.val);
      }
      if (this.options.htmlEntities) {
        for (let entityName2 in this.htmlEntities) {
          const entity = this.htmlEntities[entityName2];
          val2 = val2.replace(entity.regex, entity.val);
        }
      }
      val2 = val2.replace(this.ampEntity.regex, this.ampEntity.val);
    }
    return val2;
  };
  function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
    if (textData) {
      if (isLeafNode === void 0)
        isLeafNode = Object.keys(currentNode.child).length === 0;
      textData = this.parseTextData(
        textData,
        currentNode.tagname,
        jPath,
        false,
        currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
        isLeafNode
      );
      if (textData !== void 0 && textData !== "")
        currentNode.add(this.options.textNodeName, textData);
      textData = "";
    }
    return textData;
  }
  function isItStopNode(stopNodes, jPath, currentTagName) {
    const allNodesExp = "*." + currentTagName;
    for (const stopNodePath in stopNodes) {
      const stopNodeExp = stopNodes[stopNodePath];
      if (allNodesExp === stopNodeExp || jPath === stopNodeExp)
        return true;
    }
    return false;
  }
  function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
    let attrBoundary;
    let tagExp = "";
    for (let index = i; index < xmlData.length; index++) {
      let ch = xmlData[index];
      if (attrBoundary) {
        if (ch === attrBoundary)
          attrBoundary = "";
      } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
      } else if (ch === closingChar[0]) {
        if (closingChar[1]) {
          if (xmlData[index + 1] === closingChar[1]) {
            return {
              data: tagExp,
              index
            };
          }
        } else {
          return {
            data: tagExp,
            index
          };
        }
      } else if (ch === "	") {
        ch = " ";
      }
      tagExp += ch;
    }
  }
  function findClosingIndex(xmlData, str, i, errMsg) {
    const closingIndex = xmlData.indexOf(str, i);
    if (closingIndex === -1) {
      throw new Error(errMsg);
    } else {
      return closingIndex + str.length - 1;
    }
  }
  function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
    const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
    if (!result)
      return;
    let tagExp = result.data;
    const closeIndex = result.index;
    const separatorIndex = tagExp.search(/\s/);
    let tagName = tagExp;
    let attrExpPresent = true;
    if (separatorIndex !== -1) {
      tagName = tagExp.substr(0, separatorIndex).replace(/\s\s*$/, "");
      tagExp = tagExp.substr(separatorIndex + 1);
    }
    const rawTagName = tagName;
    if (removeNSPrefix) {
      const colonIndex = tagName.indexOf(":");
      if (colonIndex !== -1) {
        tagName = tagName.substr(colonIndex + 1);
        attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
      }
    }
    return {
      tagName,
      tagExp,
      closeIndex,
      attrExpPresent,
      rawTagName
    };
  }
  function readStopNodeData(xmlData, tagName, i) {
    const startIndex = i;
    let openTagCount = 1;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        if (xmlData[i + 1] === "/") {
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
          if (closeTagName === tagName) {
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i: closeIndex
              };
            }
          }
          i = closeIndex;
        } else if (xmlData[i + 1] === "?") {
          const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
          i = closeIndex;
        } else if (xmlData.substr(i + 1, 3) === "!--") {
          const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
          i = closeIndex;
        } else if (xmlData.substr(i + 1, 2) === "![") {
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i = closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, ">");
          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
              openTagCount++;
            }
            i = tagData.closeIndex;
          }
        }
      }
    }
  }
  function parseValue(val2, shouldParse, options) {
    if (shouldParse && typeof val2 === "string") {
      const newval = val2.trim();
      if (newval === "true")
        return true;
      else if (newval === "false")
        return false;
      else
        return toNumber(val2, options);
    } else {
      if (util.isExist(val2)) {
        return val2;
      } else {
        return "";
      }
    }
  }
  var OrderedObjParser_1 = OrderedObjParser$1;
  var node2json = {};
  function prettify$1(node, options) {
    return compress(node, options);
  }
  function compress(arr, options, jPath) {
    let text;
    const compressedObj = {};
    for (let i = 0; i < arr.length; i++) {
      const tagObj = arr[i];
      const property = propName$1(tagObj);
      let newJpath = "";
      if (jPath === void 0)
        newJpath = property;
      else
        newJpath = jPath + "." + property;
      if (property === options.textNodeName) {
        if (text === void 0)
          text = tagObj[property];
        else
          text += "" + tagObj[property];
      } else if (property === void 0) {
        continue;
      } else if (tagObj[property]) {
        let val2 = compress(tagObj[property], options, newJpath);
        const isLeaf = isLeafTag(val2, options);
        if (tagObj[":@"]) {
          assignAttributes(val2, tagObj[":@"], newJpath, options);
        } else if (Object.keys(val2).length === 1 && val2[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
          val2 = val2[options.textNodeName];
        } else if (Object.keys(val2).length === 0) {
          if (options.alwaysCreateTextNode)
            val2[options.textNodeName] = "";
          else
            val2 = "";
        }
        if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
          if (!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [compressedObj[property]];
          }
          compressedObj[property].push(val2);
        } else {
          if (options.isArray(property, newJpath, isLeaf)) {
            compressedObj[property] = [val2];
          } else {
            compressedObj[property] = val2;
          }
        }
      }
    }
    if (typeof text === "string") {
      if (text.length > 0)
        compressedObj[options.textNodeName] = text;
    } else if (text !== void 0)
      compressedObj[options.textNodeName] = text;
    return compressedObj;
  }
  function propName$1(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== ":@")
        return key;
    }
  }
  function assignAttributes(obj, attrMap, jpath, options) {
    if (attrMap) {
      const keys = Object.keys(attrMap);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const atrrName = keys[i];
        if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
          obj[atrrName] = [attrMap[atrrName]];
        } else {
          obj[atrrName] = attrMap[atrrName];
        }
      }
    }
  }
  function isLeafTag(obj, options) {
    const { textNodeName } = options;
    const propCount = Object.keys(obj).length;
    if (propCount === 0) {
      return true;
    }
    if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
      return true;
    }
    return false;
  }
  node2json.prettify = prettify$1;
  const { buildOptions } = OptionsBuilder;
  const OrderedObjParser2 = OrderedObjParser_1;
  const { prettify } = node2json;
  const validator$1 = validator$2;
  let XMLParser$1 = class XMLParser {
    constructor(options) {
      this.externalEntities = {};
      this.options = buildOptions(options);
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Buffer} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData, validationOption) {
      if (typeof xmlData === "string")
        ;
      else if (xmlData.toString) {
        xmlData = xmlData.toString();
      } else {
        throw new Error("XML data is accepted in String or Bytes[] form.");
      }
      if (validationOption) {
        if (validationOption === true)
          validationOption = {};
        const result = validator$1.validate(xmlData, validationOption);
        if (result !== true) {
          throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
        }
      }
      const orderedObjParser = new OrderedObjParser2(this.options);
      orderedObjParser.addExternalEntities(this.externalEntities);
      const orderedResult = orderedObjParser.parseXml(xmlData);
      if (this.options.preserveOrder || orderedResult === void 0)
        return orderedResult;
      else
        return prettify(orderedResult, this.options);
    }
    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value) {
      if (value.indexOf("&") !== -1) {
        throw new Error("Entity value can't have '&'");
      } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
        throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
      } else if (value === "&") {
        throw new Error("An entity with value '&' is not permitted");
      } else {
        this.externalEntities[key] = value;
      }
    }
  };
  var XMLParser_1 = XMLParser$1;
  const EOL = "\n";
  function toXml(jArray, options) {
    let indentation = "";
    if (options.format && options.indentBy.length > 0) {
      indentation = EOL;
    }
    return arrToStr(jArray, options, "", indentation);
  }
  function arrToStr(arr, options, jPath, indentation) {
    let xmlStr = "";
    let isPreviousElementTag = false;
    for (let i = 0; i < arr.length; i++) {
      const tagObj = arr[i];
      const tagName = propName(tagObj);
      if (tagName === void 0)
        continue;
      let newJPath = "";
      if (jPath.length === 0)
        newJPath = tagName;
      else
        newJPath = `${jPath}.${tagName}`;
      if (tagName === options.textNodeName) {
        let tagText = tagObj[tagName];
        if (!isStopNode(newJPath, options)) {
          tagText = options.tagValueProcessor(tagName, tagText);
          tagText = replaceEntitiesValue(tagText, options);
        }
        if (isPreviousElementTag) {
          xmlStr += indentation;
        }
        xmlStr += tagText;
        isPreviousElementTag = false;
        continue;
      } else if (tagName === options.cdataPropName) {
        if (isPreviousElementTag) {
          xmlStr += indentation;
        }
        xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
        isPreviousElementTag = false;
        continue;
      } else if (tagName === options.commentPropName) {
        xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
        isPreviousElementTag = true;
        continue;
      } else if (tagName[0] === "?") {
        const attStr2 = attr_to_str(tagObj[":@"], options);
        const tempInd = tagName === "?xml" ? "" : indentation;
        let piTextNodeName = tagObj[tagName][0][options.textNodeName];
        piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
        xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
        isPreviousElementTag = true;
        continue;
      }
      let newIdentation = indentation;
      if (newIdentation !== "") {
        newIdentation += options.indentBy;
      }
      const attStr = attr_to_str(tagObj[":@"], options);
      const tagStart = indentation + `<${tagName}${attStr}`;
      const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
      if (options.unpairedTags.indexOf(tagName) !== -1) {
        if (options.suppressUnpairedNode)
          xmlStr += tagStart + ">";
        else
          xmlStr += tagStart + "/>";
      } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
        xmlStr += tagStart + "/>";
      } else if (tagValue && tagValue.endsWith(">")) {
        xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
      } else {
        xmlStr += tagStart + ">";
        if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
          xmlStr += indentation + options.indentBy + tagValue + indentation;
        } else {
          xmlStr += tagValue;
        }
        xmlStr += `</${tagName}>`;
      }
      isPreviousElementTag = true;
    }
    return xmlStr;
  }
  function propName(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!obj.hasOwnProperty(key))
        continue;
      if (key !== ":@")
        return key;
    }
  }
  function attr_to_str(attrMap, options) {
    let attrStr = "";
    if (attrMap && !options.ignoreAttributes) {
      for (let attr in attrMap) {
        if (!attrMap.hasOwnProperty(attr))
          continue;
        let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
        attrVal = replaceEntitiesValue(attrVal, options);
        if (attrVal === true && options.suppressBooleanAttributes) {
          attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
        } else {
          attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
        }
      }
    }
    return attrStr;
  }
  function isStopNode(jPath, options) {
    jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
    let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
    for (let index in options.stopNodes) {
      if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName)
        return true;
    }
    return false;
  }
  function replaceEntitiesValue(textValue, options) {
    if (textValue && textValue.length > 0 && options.processEntities) {
      for (let i = 0; i < options.entities.length; i++) {
        const entity = options.entities[i];
        textValue = textValue.replace(entity.regex, entity.val);
      }
    }
    return textValue;
  }
  var orderedJs2Xml = toXml;
  const buildFromOrderedJs = orderedJs2Xml;
  const defaultOptions = {
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    cdataPropName: false,
    format: false,
    indentBy: "  ",
    suppressEmptyNode: false,
    suppressUnpairedNode: true,
    suppressBooleanAttributes: true,
    tagValueProcessor: function(key, a) {
      return a;
    },
    attributeValueProcessor: function(attrName, a) {
      return a;
    },
    preserveOrder: false,
    commentPropName: false,
    unpairedTags: [],
    entities: [
      { regex: new RegExp("&", "g"), val: "&amp;" },
      //it must be on top
      { regex: new RegExp(">", "g"), val: "&gt;" },
      { regex: new RegExp("<", "g"), val: "&lt;" },
      { regex: new RegExp("'", "g"), val: "&apos;" },
      { regex: new RegExp('"', "g"), val: "&quot;" }
    ],
    processEntities: true,
    stopNodes: [],
    // transformTagName: false,
    // transformAttributeName: false,
    oneListGroup: false
  };
  function Builder(options) {
    this.options = Object.assign({}, defaultOptions, options);
    if (this.options.ignoreAttributes || this.options.attributesGroupName) {
      this.isAttribute = function() {
        return false;
      };
    } else {
      this.attrPrefixLen = this.options.attributeNamePrefix.length;
      this.isAttribute = isAttribute;
    }
    this.processTextOrObjNode = processTextOrObjNode;
    if (this.options.format) {
      this.indentate = indentate;
      this.tagEndChar = ">\n";
      this.newLine = "\n";
    } else {
      this.indentate = function() {
        return "";
      };
      this.tagEndChar = ">";
      this.newLine = "";
    }
  }
  Builder.prototype.build = function(jObj) {
    if (this.options.preserveOrder) {
      return buildFromOrderedJs(jObj, this.options);
    } else {
      if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
        jObj = {
          [this.options.arrayNodeName]: jObj
        };
      }
      return this.j2x(jObj, 0).val;
    }
  };
  Builder.prototype.j2x = function(jObj, level) {
    let attrStr = "";
    let val2 = "";
    for (let key in jObj) {
      if (!Object.prototype.hasOwnProperty.call(jObj, key))
        continue;
      if (typeof jObj[key] === "undefined") {
        if (this.isAttribute(key)) {
          val2 += "";
        }
      } else if (jObj[key] === null) {
        if (this.isAttribute(key)) {
          val2 += "";
        } else if (key[0] === "?") {
          val2 += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
        } else {
          val2 += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
        }
      } else if (jObj[key] instanceof Date) {
        val2 += this.buildTextValNode(jObj[key], key, "", level);
      } else if (typeof jObj[key] !== "object") {
        const attr = this.isAttribute(key);
        if (attr) {
          attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
        } else {
          if (key === this.options.textNodeName) {
            let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
            val2 += this.replaceEntitiesValue(newval);
          } else {
            val2 += this.buildTextValNode(jObj[key], key, "", level);
          }
        }
      } else if (Array.isArray(jObj[key])) {
        const arrLen = jObj[key].length;
        let listTagVal = "";
        for (let j = 0; j < arrLen; j++) {
          const item = jObj[key][j];
          if (typeof item === "undefined")
            ;
          else if (item === null) {
            if (key[0] === "?")
              val2 += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
            else
              val2 += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          } else if (typeof item === "object") {
            if (this.options.oneListGroup) {
              listTagVal += this.j2x(item, level + 1).val;
            } else {
              listTagVal += this.processTextOrObjNode(item, key, level);
            }
          } else {
            listTagVal += this.buildTextValNode(item, key, "", level);
          }
        }
        if (this.options.oneListGroup) {
          listTagVal = this.buildObjectNode(listTagVal, key, "", level);
        }
        val2 += listTagVal;
      } else {
        if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
          const Ks = Object.keys(jObj[key]);
          const L = Ks.length;
          for (let j = 0; j < L; j++) {
            attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
          }
        } else {
          val2 += this.processTextOrObjNode(jObj[key], key, level);
        }
      }
    }
    return { attrStr, val: val2 };
  };
  Builder.prototype.buildAttrPairStr = function(attrName, val2) {
    val2 = this.options.attributeValueProcessor(attrName, "" + val2);
    val2 = this.replaceEntitiesValue(val2);
    if (this.options.suppressBooleanAttributes && val2 === "true") {
      return " " + attrName;
    } else
      return " " + attrName + '="' + val2 + '"';
  };
  function processTextOrObjNode(object2, key, level) {
    const result = this.j2x(object2, level + 1);
    if (object2[this.options.textNodeName] !== void 0 && Object.keys(object2).length === 1) {
      return this.buildTextValNode(object2[this.options.textNodeName], key, result.attrStr, level);
    } else {
      return this.buildObjectNode(result.val, key, result.attrStr, level);
    }
  }
  Builder.prototype.buildObjectNode = function(val2, key, attrStr, level) {
    if (val2 === "") {
      if (key[0] === "?")
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      else {
        return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
      }
    } else {
      let tagEndExp = "</" + key + this.tagEndChar;
      let piClosingChar = "";
      if (key[0] === "?") {
        piClosingChar = "?";
        tagEndExp = "";
      }
      if ((attrStr || attrStr === "") && val2.indexOf("<") === -1) {
        return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val2 + tagEndExp;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
        return this.indentate(level) + `<!--${val2}-->` + this.newLine;
      } else {
        return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val2 + this.indentate(level) + tagEndExp;
      }
    }
  };
  Builder.prototype.closeTag = function(key) {
    let closeTag = "";
    if (this.options.unpairedTags.indexOf(key) !== -1) {
      if (!this.options.suppressUnpairedNode)
        closeTag = "/";
    } else if (this.options.suppressEmptyNode) {
      closeTag = "/";
    } else {
      closeTag = `></${key}`;
    }
    return closeTag;
  };
  Builder.prototype.buildTextValNode = function(val2, key, attrStr, level) {
    if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
      return this.indentate(level) + `<![CDATA[${val2}]]>` + this.newLine;
    } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
      return this.indentate(level) + `<!--${val2}-->` + this.newLine;
    } else if (key[0] === "?") {
      return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
    } else {
      let textValue = this.options.tagValueProcessor(key, val2);
      textValue = this.replaceEntitiesValue(textValue);
      if (textValue === "") {
        return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
      } else {
        return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
      }
    }
  };
  Builder.prototype.replaceEntitiesValue = function(textValue) {
    if (textValue && textValue.length > 0 && this.options.processEntities) {
      for (let i = 0; i < this.options.entities.length; i++) {
        const entity = this.options.entities[i];
        textValue = textValue.replace(entity.regex, entity.val);
      }
    }
    return textValue;
  };
  function indentate(level) {
    return this.options.indentBy.repeat(level);
  }
  function isAttribute(name) {
    if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
      return name.substr(this.attrPrefixLen);
    } else {
      return false;
    }
  }
  var json2xml = Builder;
  const validator = validator$2;
  const XMLParser2 = XMLParser_1;
  const XMLBuilder = json2xml;
  var fxp = {
    XMLParser: XMLParser2,
    XMLValidator: validator,
    XMLBuilder
  };
  function parseRawHeaders(h) {
    const s = h.trim();
    if (!s) {
      return new Headers();
    }
    const array2 = s.split("\r\n").map((value) => {
      let s2 = value.split(":");
      return [s2[0].trim(), s2[1].trim()];
    });
    return new Headers(array2);
  }
  function parseGMResponse(req, res) {
    return new ResImpl(res.response, {
      statusCode: res.status,
      statusText: res.statusText,
      headers: parseRawHeaders(res.responseHeaders),
      finalUrl: res.finalUrl,
      redirected: res.finalUrl === req.url
    });
  }
  class ResImpl {
    constructor(body, init) {
      this.rawBody = body;
      this.init = init;
      this.body = toReadableStream(body);
      const { headers, statusCode, statusText, finalUrl, redirected } = init;
      this.headers = headers;
      this.status = statusCode;
      this.statusText = statusText;
      this.url = finalUrl;
      this.type = "basic";
      this.redirected = redirected;
      this._bodyUsed = false;
    }
    get bodyUsed() {
      return this._bodyUsed;
    }
    get ok() {
      return this.status < 300;
    }
    arrayBuffer() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'arrayBuffer' on 'Response': body stream already read");
      }
      this._bodyUsed = true;
      return this.rawBody.arrayBuffer();
    }
    blob() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'blob' on 'Response': body stream already read");
      }
      this._bodyUsed = true;
      return Promise.resolve(this.rawBody.slice(0, this.rawBody.size, this.rawBody.type));
    }
    clone() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'clone' on 'Response': body stream already read");
      }
      return new ResImpl(this.rawBody, this.init);
    }
    formData() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'formData' on 'Response': body stream already read");
      }
      this._bodyUsed = true;
      return this.rawBody.text().then(decode$2);
    }
    async json() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'json' on 'Response': body stream already read");
      }
      this._bodyUsed = true;
      return JSON.parse(await this.rawBody.text());
    }
    text() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'text' on 'Response': body stream already read");
      }
      this._bodyUsed = true;
      return this.rawBody.text();
    }
  }
  function decode$2(body) {
    const form = new FormData();
    body.trim().split("&").forEach(function(bytes) {
      var _a;
      if (bytes) {
        const split = bytes.split("=");
        const name = (_a = split.shift()) == null ? void 0 : _a.replace(/\+/g, " ");
        const value = split.join("=").replace(/\+/g, " ");
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }
  function toReadableStream(value) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(value);
        controller.close();
      }
    });
  }
  async function GM_fetch(input, init) {
    const request = new Request(input, init);
    let data;
    if (init == null ? void 0 : init.body) {
      data = await request.text();
    }
    return await XHR(request, init, data);
  }
  function XHR(request, init, data) {
    return new Promise((resolve, reject) => {
      if (request.signal && request.signal.aborted) {
        return reject(new DOMException("Aborted", "AbortError"));
      }
      GM.xmlHttpRequest({
        url: request.url,
        method: gmXHRMethod(request.method.toUpperCase()),
        headers: Object.fromEntries(new Headers(init == null ? void 0 : init.headers).entries()),
        data,
        responseType: "blob",
        onload(res) {
          resolve(parseGMResponse(request, res));
        },
        onabort() {
          reject(new DOMException("Aborted", "AbortError"));
        },
        ontimeout() {
          reject(new TypeError("Network request failed, timeout"));
        },
        onerror(err) {
          reject(new TypeError("Failed to fetch: " + err.finalUrl));
        }
      });
    });
  }
  const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "TRACE", "OPTIONS", "CONNECT"];
  function includes(array2, element) {
    return array2.includes(element);
  }
  function gmXHRMethod(method) {
    if (includes(httpMethods, method)) {
      return method;
    }
    throw new Error(`unsupported http method ${method}`);
  }
  const xmlParser = new fxp.XMLParser();
  const CLIENT_APP_ID = "p1110417";
  const TERMINAL_TYPE = 10;
  const ENDPOINT = "https://p1.petitlyrics.com/api/GetPetitLyricsData.php";
  const fetchApi = async (options) => {
    const res_s = await (await GM_fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        ...options,
        terminalType: TERMINAL_TYPE.toString(),
        clientAppId: CLIENT_APP_ID
      })
    })).text();
    const res = xmlParser.parse(res_s);
    return res;
  };
  var ValiError = class extends Error {
    /**
     * Creates a Valibot error with useful information.
     *
     * @param issues The error issues.
     */
    constructor(issues) {
      super(issues[0].message);
      __publicField(this, "issues");
      this.name = "ValiError";
      this.issues = issues;
    }
  };
  function coerce(schema, action) {
    return {
      ...schema,
      _parse(input, info) {
        return schema._parse(action(input), info);
      }
    };
  }
  function errorMessage(message) {
    return typeof message === "function" ? message() : message;
  }
  function defaultArgs(arg1, arg2) {
    return Array.isArray(arg1) ? [void 0, arg1] : [arg1, arg2];
  }
  function parseResult(typed, output, issues) {
    return { typed, output, issues };
  }
  function restAndDefaultArgs(arg1, arg2, arg3) {
    if (!arg1 || typeof arg1 === "object" && !Array.isArray(arg1)) {
      const [error2, pipe2] = defaultArgs(arg2, arg3);
      return [arg1, error2, pipe2];
    }
    const [error, pipe] = defaultArgs(
      arg1,
      arg2
    );
    return [void 0, error, pipe];
  }
  function pipeIssue(info, issue) {
    return {
      reason: info == null ? void 0 : info.reason,
      validation: issue.validation,
      origin: (info == null ? void 0 : info.origin) || "value",
      message: issue.message,
      input: issue.input,
      requirement: issue == null ? void 0 : issue.requirement,
      path: issue.path,
      abortEarly: info == null ? void 0 : info.abortEarly,
      abortPipeEarly: info == null ? void 0 : info.abortPipeEarly,
      skipPipe: info == null ? void 0 : info.skipPipe
    };
  }
  function pipeInfo(info, reason) {
    return {
      reason,
      origin: info == null ? void 0 : info.origin,
      abortEarly: info == null ? void 0 : info.abortEarly,
      abortPipeEarly: info == null ? void 0 : info.abortPipeEarly,
      skipPipe: info == null ? void 0 : info.skipPipe
    };
  }
  function pipeResult(input, pipe, parseInfo, reason, issues) {
    let info;
    let output = input;
    if ((pipe == null ? void 0 : pipe.length) && !(parseInfo == null ? void 0 : parseInfo.skipPipe)) {
      for (const action of pipe) {
        const result = action._parse(output);
        if (result.issues) {
          info = info || pipeInfo(parseInfo, reason);
          for (const issueInfo of result.issues) {
            const issue = pipeIssue(info, issueInfo);
            issues ? issues.push(issue) : issues = [issue];
          }
          if (info.abortEarly || info.abortPipeEarly) {
            break;
          }
        } else {
          output = result.output;
        }
      }
    }
    return parseResult(true, output, issues);
  }
  function schemaIssue(info, reason, validation, message, input, issues) {
    return {
      typed: false,
      output: input,
      issues: [
        {
          reason,
          validation,
          origin: (info == null ? void 0 : info.origin) || "value",
          message: errorMessage(message),
          input,
          issues,
          abortEarly: info == null ? void 0 : info.abortEarly,
          abortPipeEarly: info == null ? void 0 : info.abortPipeEarly,
          skipPipe: info == null ? void 0 : info.skipPipe
        }
      ]
    };
  }
  function getDefault(schema) {
    return typeof schema.default === "function" ? schema.default() : schema.default;
  }
  function array(item, arg2, arg3) {
    const [message = "Invalid type", pipe] = defaultArgs(arg2, arg3);
    return {
      type: "array",
      async: false,
      item,
      message,
      pipe,
      _parse(input, info) {
        if (!Array.isArray(input)) {
          return schemaIssue(info, "type", "array", this.message, input);
        }
        let typed = true;
        let issues;
        const output = [];
        for (let key = 0; key < input.length; key++) {
          const value2 = input[key];
          const result = this.item._parse(value2, info);
          if (result.issues) {
            const pathItem = {
              type: "array",
              input,
              key,
              value: value2
            };
            for (const issue of result.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              issues == null ? void 0 : issues.push(issue);
            }
            if (!issues) {
              issues = result.issues;
            }
            if (info == null ? void 0 : info.abortEarly) {
              typed = false;
              break;
            }
          }
          if (!result.typed) {
            typed = false;
          }
          output.push(result.output);
        }
        if (typed) {
          return pipeResult(
            output,
            this.pipe,
            info,
            "array",
            issues
          );
        }
        return parseResult(false, output, issues);
      }
    };
  }
  function number(arg1, arg2) {
    const [message = "Invalid type", pipe] = defaultArgs(arg1, arg2);
    return {
      type: "number",
      async: false,
      message,
      pipe,
      _parse(input, info) {
        if (typeof input !== "number" || isNaN(input)) {
          return schemaIssue(info, "type", "number", this.message, input);
        }
        return pipeResult(input, this.pipe, info, "number");
      }
    };
  }
  function object(entries, arg2, arg3, arg4) {
    const [rest, message = "Invalid type", pipe] = restAndDefaultArgs(arg2, arg3, arg4);
    let cachedEntries;
    return {
      type: "object",
      async: false,
      entries,
      rest,
      message,
      pipe,
      _parse(input, info) {
        if (!input || typeof input !== "object") {
          return schemaIssue(info, "type", "object", this.message, input);
        }
        cachedEntries = cachedEntries || Object.entries(this.entries);
        let typed = true;
        let issues;
        const output = {};
        for (const [key, schema] of cachedEntries) {
          const value2 = input[key];
          const result = schema._parse(value2, info);
          if (result.issues) {
            const pathItem = {
              type: "object",
              input,
              key,
              value: value2
            };
            for (const issue of result.issues) {
              if (issue.path) {
                issue.path.unshift(pathItem);
              } else {
                issue.path = [pathItem];
              }
              issues == null ? void 0 : issues.push(issue);
            }
            if (!issues) {
              issues = result.issues;
            }
            if (info == null ? void 0 : info.abortEarly) {
              typed = false;
              break;
            }
          }
          if (!result.typed) {
            typed = false;
          }
          if (result.output !== void 0 || key in input) {
            output[key] = result.output;
          }
        }
        if (this.rest && !((info == null ? void 0 : info.abortEarly) && issues)) {
          for (const key in input) {
            if (!(key in this.entries)) {
              const value2 = input[key];
              const result = this.rest._parse(value2, info);
              if (result.issues) {
                const pathItem = {
                  type: "object",
                  input,
                  key,
                  value: value2
                };
                for (const issue of result.issues) {
                  if (issue.path) {
                    issue.path.unshift(pathItem);
                  } else {
                    issue.path = [pathItem];
                  }
                  issues == null ? void 0 : issues.push(issue);
                }
                if (!issues) {
                  issues = result.issues;
                }
                if (info == null ? void 0 : info.abortEarly) {
                  typed = false;
                  break;
                }
              }
              if (!result.typed) {
                typed = false;
              }
              output[key] = result.output;
            }
          }
        }
        if (typed) {
          return pipeResult(
            output,
            this.pipe,
            info,
            "object",
            issues
          );
        }
        return parseResult(false, output, issues);
      }
    };
  }
  function optional(wrapped, default_) {
    return {
      type: "optional",
      async: false,
      wrapped,
      default: default_,
      _parse(input, info) {
        if (input === void 0) {
          const override = getDefault(this);
          if (override === void 0) {
            return parseResult(true, input);
          }
          input = override;
        }
        return this.wrapped._parse(input, info);
      }
    };
  }
  function string(arg1, arg2) {
    const [message = "Invalid type", pipe] = defaultArgs(arg1, arg2);
    return {
      type: "string",
      async: false,
      message,
      pipe,
      _parse(input, info) {
        if (typeof input !== "string") {
          return schemaIssue(info, "type", "string", this.message, input);
        }
        return pipeResult(input, this.pipe, info, "string");
      }
    };
  }
  function parse(schema, input, info) {
    const result = schema._parse(input, info);
    if (result.issues) {
      throw new ValiError(result.issues);
    }
    return result.output;
  }
  const _hasatob = typeof atob === "function";
  const _hasBuffer = typeof Buffer === "function";
  const _TD = typeof TextDecoder === "function" ? new TextDecoder() : void 0;
  typeof TextEncoder === "function" ? new TextEncoder() : void 0;
  const b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const b64chs = Array.prototype.slice.call(b64ch);
  const b64tab = ((a) => {
    let tab = {};
    a.forEach((c, i) => tab[c] = i);
    return tab;
  })(b64chs);
  const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
  const _fromCC = String.fromCharCode.bind(String);
  const _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
  const _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
  const re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
  const cb_btou = (cccc) => {
    switch (cccc.length) {
      case 4:
        var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
        return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
      case 3:
        return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
      default:
        return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
    }
  };
  const btou = (b) => b.replace(re_btou, cb_btou);
  const atobPolyfill = (asc) => {
    asc = asc.replace(/\s+/g, "");
    if (!b64re.test(asc))
      throw new TypeError("malformed base64.");
    asc += "==".slice(2 - (asc.length & 3));
    let u24, bin = "", r1, r2;
    for (let i = 0; i < asc.length; ) {
      u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
      bin += r1 === 64 ? _fromCC(u24 >> 16 & 255) : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255) : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);
    }
    return bin;
  };
  const _atob = _hasatob ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, "base64").toString("binary") : atobPolyfill;
  const _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, "base64")) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));
  const _decode = _hasBuffer ? (a) => Buffer.from(a, "base64").toString("utf8") : _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
  const _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));
  const decode$1 = (src) => _decode(_unURI(src));
  const ResponseSchema$1 = object({
    response: object({
      songs: object({
        song: optional(
          coerce(
            array(
              object({
                lyricsId: number(),
                artist: string(),
                title: string(),
                album: string(),
                lyricsData: string()
              })
            ),
            (v2) => {
              if (!Array.isArray(v2)) {
                return [v2];
              }
              return v2;
            }
          )
        )
      })
    })
  });
  const getNotSyncedLyrics = async (options) => {
    var _a;
    const res_o = await fetchApi({ ...options, lyricsType: 1 });
    const res = parse(ResponseSchema$1, res_o);
    const lyricData = (_a = res.response.songs.song) == null ? void 0 : _a[0].lyricsData;
    if (!lyricData) {
      throw new Error("Lyric not found");
    }
    return decode$1(lyricData);
  };
  const WordSyncedLyricsDataSchema = object({
    wsy: object({
      line: array(object({
        word: coerce(
          array(object({
            starttime: number(),
            endtime: number(),
            wordstring: coerce(string(), String)
          })),
          (v2) => {
            if (!Array.isArray(v2)) {
              return [v2];
            }
            return v2;
          }
        )
      }))
    })
  });
  const getWordSyncedLyrics = async (options) => {
    var _a;
    const res_o = await fetchApi({ ...options, lyricsType: 3 });
    const res = parse(ResponseSchema$1, res_o);
    const lyricData = (_a = res.response.songs.song) == null ? void 0 : _a[0].lyricsData;
    if (!lyricData) {
      throw new Error("Lyric not found");
    }
    const lyricDataObj = xmlParser.parse(decode$1(lyricData));
    return parse(
      WordSyncedLyricsDataSchema,
      lyricDataObj
    );
  };
  const ResponseSchema = object({
    response: object({
      songs: object({
        song: optional(
          coerce(
            array(object({
              lyricsId: number(),
              artist: string(),
              title: string(),
              album: string()
            })),
            (v2) => {
              if (!Array.isArray(v2)) {
                return [v2];
              }
              return v2;
            }
          )
        )
      })
    })
  });
  const search = async (options) => {
    const res = await fetchApi(options);
    return parse(ResponseSchema, res);
  };
  const usePlayerInfo = () => {
    const [playerInfo, setPlayerInfo] = createStore({});
    const listener = (event) => {
      const elem = event.target;
      setPlayerInfo("data", {
        paused: elem.paused,
        currentTime: elem.currentTime
      });
    };
    onMount(() => {
      const videoElement = document.querySelector("video");
      if (!videoElement) {
        return;
      }
      videoElement.addEventListener("timeupdate", listener);
    });
    onCleanup(() => {
      const videoElement = document.querySelector("video");
      if (!videoElement) {
        return;
      }
      videoElement.removeEventListener("timeupdate", listener);
    });
    return playerInfo;
  };
  var lib = {};
  var namedReferences = {};
  Object.defineProperty(namedReferences, "__esModule", { value: true });
  namedReferences.bodyRegExps = { xml: /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g, html4: /&notin;|&(?:nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|ucirc|uuml|yacute|thorn|yuml|quot|amp|lt|gt|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g, html5: /&centerdot;|&copysr;|&divideontimes;|&gtcc;|&gtcir;|&gtdot;|&gtlPar;|&gtquest;|&gtrapprox;|&gtrarr;|&gtrdot;|&gtreqless;|&gtreqqless;|&gtrless;|&gtrsim;|&ltcc;|&ltcir;|&ltdot;|&lthree;|&ltimes;|&ltlarr;|&ltquest;|&ltrPar;|&ltri;|&ltrie;|&ltrif;|&notin;|&notinE;|&notindot;|&notinva;|&notinvb;|&notinvc;|&notni;|&notniva;|&notnivb;|&notnivc;|&parallel;|&timesb;|&timesbar;|&timesd;|&(?:AElig|AMP|Aacute|Acirc|Agrave|Aring|Atilde|Auml|COPY|Ccedil|ETH|Eacute|Ecirc|Egrave|Euml|GT|Iacute|Icirc|Igrave|Iuml|LT|Ntilde|Oacute|Ocirc|Ograve|Oslash|Otilde|Ouml|QUOT|REG|THORN|Uacute|Ucirc|Ugrave|Uuml|Yacute|aacute|acirc|acute|aelig|agrave|amp|aring|atilde|auml|brvbar|ccedil|cedil|cent|copy|curren|deg|divide|eacute|ecirc|egrave|eth|euml|frac12|frac14|frac34|gt|iacute|icirc|iexcl|igrave|iquest|iuml|laquo|lt|macr|micro|middot|nbsp|not|ntilde|oacute|ocirc|ograve|ordf|ordm|oslash|otilde|ouml|para|plusmn|pound|quot|raquo|reg|sect|shy|sup1|sup2|sup3|szlig|thorn|times|uacute|ucirc|ugrave|uml|uuml|yacute|yen|yuml|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g };
  namedReferences.namedReferences = { xml: { entities: { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&amp;": "&" }, characters: { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;", "&": "&amp;" } }, html4: { entities: { "&apos;": "'", "&nbsp": " ", "&nbsp;": " ", "&iexcl": "¡", "&iexcl;": "¡", "&cent": "¢", "&cent;": "¢", "&pound": "£", "&pound;": "£", "&curren": "¤", "&curren;": "¤", "&yen": "¥", "&yen;": "¥", "&brvbar": "¦", "&brvbar;": "¦", "&sect": "§", "&sect;": "§", "&uml": "¨", "&uml;": "¨", "&copy": "©", "&copy;": "©", "&ordf": "ª", "&ordf;": "ª", "&laquo": "«", "&laquo;": "«", "&not": "¬", "&not;": "¬", "&shy": "­", "&shy;": "­", "&reg": "®", "&reg;": "®", "&macr": "¯", "&macr;": "¯", "&deg": "°", "&deg;": "°", "&plusmn": "±", "&plusmn;": "±", "&sup2": "²", "&sup2;": "²", "&sup3": "³", "&sup3;": "³", "&acute": "´", "&acute;": "´", "&micro": "µ", "&micro;": "µ", "&para": "¶", "&para;": "¶", "&middot": "·", "&middot;": "·", "&cedil": "¸", "&cedil;": "¸", "&sup1": "¹", "&sup1;": "¹", "&ordm": "º", "&ordm;": "º", "&raquo": "»", "&raquo;": "»", "&frac14": "¼", "&frac14;": "¼", "&frac12": "½", "&frac12;": "½", "&frac34": "¾", "&frac34;": "¾", "&iquest": "¿", "&iquest;": "¿", "&Agrave": "À", "&Agrave;": "À", "&Aacute": "Á", "&Aacute;": "Á", "&Acirc": "Â", "&Acirc;": "Â", "&Atilde": "Ã", "&Atilde;": "Ã", "&Auml": "Ä", "&Auml;": "Ä", "&Aring": "Å", "&Aring;": "Å", "&AElig": "Æ", "&AElig;": "Æ", "&Ccedil": "Ç", "&Ccedil;": "Ç", "&Egrave": "È", "&Egrave;": "È", "&Eacute": "É", "&Eacute;": "É", "&Ecirc": "Ê", "&Ecirc;": "Ê", "&Euml": "Ë", "&Euml;": "Ë", "&Igrave": "Ì", "&Igrave;": "Ì", "&Iacute": "Í", "&Iacute;": "Í", "&Icirc": "Î", "&Icirc;": "Î", "&Iuml": "Ï", "&Iuml;": "Ï", "&ETH": "Ð", "&ETH;": "Ð", "&Ntilde": "Ñ", "&Ntilde;": "Ñ", "&Ograve": "Ò", "&Ograve;": "Ò", "&Oacute": "Ó", "&Oacute;": "Ó", "&Ocirc": "Ô", "&Ocirc;": "Ô", "&Otilde": "Õ", "&Otilde;": "Õ", "&Ouml": "Ö", "&Ouml;": "Ö", "&times": "×", "&times;": "×", "&Oslash": "Ø", "&Oslash;": "Ø", "&Ugrave": "Ù", "&Ugrave;": "Ù", "&Uacute": "Ú", "&Uacute;": "Ú", "&Ucirc": "Û", "&Ucirc;": "Û", "&Uuml": "Ü", "&Uuml;": "Ü", "&Yacute": "Ý", "&Yacute;": "Ý", "&THORN": "Þ", "&THORN;": "Þ", "&szlig": "ß", "&szlig;": "ß", "&agrave": "à", "&agrave;": "à", "&aacute": "á", "&aacute;": "á", "&acirc": "â", "&acirc;": "â", "&atilde": "ã", "&atilde;": "ã", "&auml": "ä", "&auml;": "ä", "&aring": "å", "&aring;": "å", "&aelig": "æ", "&aelig;": "æ", "&ccedil": "ç", "&ccedil;": "ç", "&egrave": "è", "&egrave;": "è", "&eacute": "é", "&eacute;": "é", "&ecirc": "ê", "&ecirc;": "ê", "&euml": "ë", "&euml;": "ë", "&igrave": "ì", "&igrave;": "ì", "&iacute": "í", "&iacute;": "í", "&icirc": "î", "&icirc;": "î", "&iuml": "ï", "&iuml;": "ï", "&eth": "ð", "&eth;": "ð", "&ntilde": "ñ", "&ntilde;": "ñ", "&ograve": "ò", "&ograve;": "ò", "&oacute": "ó", "&oacute;": "ó", "&ocirc": "ô", "&ocirc;": "ô", "&otilde": "õ", "&otilde;": "õ", "&ouml": "ö", "&ouml;": "ö", "&divide": "÷", "&divide;": "÷", "&oslash": "ø", "&oslash;": "ø", "&ugrave": "ù", "&ugrave;": "ù", "&uacute": "ú", "&uacute;": "ú", "&ucirc": "û", "&ucirc;": "û", "&uuml": "ü", "&uuml;": "ü", "&yacute": "ý", "&yacute;": "ý", "&thorn": "þ", "&thorn;": "þ", "&yuml": "ÿ", "&yuml;": "ÿ", "&quot": '"', "&quot;": '"', "&amp": "&", "&amp;": "&", "&lt": "<", "&lt;": "<", "&gt": ">", "&gt;": ">", "&OElig;": "Œ", "&oelig;": "œ", "&Scaron;": "Š", "&scaron;": "š", "&Yuml;": "Ÿ", "&circ;": "ˆ", "&tilde;": "˜", "&ensp;": " ", "&emsp;": " ", "&thinsp;": " ", "&zwnj;": "‌", "&zwj;": "‍", "&lrm;": "‎", "&rlm;": "‏", "&ndash;": "–", "&mdash;": "—", "&lsquo;": "‘", "&rsquo;": "’", "&sbquo;": "‚", "&ldquo;": "“", "&rdquo;": "”", "&bdquo;": "„", "&dagger;": "†", "&Dagger;": "‡", "&permil;": "‰", "&lsaquo;": "‹", "&rsaquo;": "›", "&euro;": "€", "&fnof;": "ƒ", "&Alpha;": "Α", "&Beta;": "Β", "&Gamma;": "Γ", "&Delta;": "Δ", "&Epsilon;": "Ε", "&Zeta;": "Ζ", "&Eta;": "Η", "&Theta;": "Θ", "&Iota;": "Ι", "&Kappa;": "Κ", "&Lambda;": "Λ", "&Mu;": "Μ", "&Nu;": "Ν", "&Xi;": "Ξ", "&Omicron;": "Ο", "&Pi;": "Π", "&Rho;": "Ρ", "&Sigma;": "Σ", "&Tau;": "Τ", "&Upsilon;": "Υ", "&Phi;": "Φ", "&Chi;": "Χ", "&Psi;": "Ψ", "&Omega;": "Ω", "&alpha;": "α", "&beta;": "β", "&gamma;": "γ", "&delta;": "δ", "&epsilon;": "ε", "&zeta;": "ζ", "&eta;": "η", "&theta;": "θ", "&iota;": "ι", "&kappa;": "κ", "&lambda;": "λ", "&mu;": "μ", "&nu;": "ν", "&xi;": "ξ", "&omicron;": "ο", "&pi;": "π", "&rho;": "ρ", "&sigmaf;": "ς", "&sigma;": "σ", "&tau;": "τ", "&upsilon;": "υ", "&phi;": "φ", "&chi;": "χ", "&psi;": "ψ", "&omega;": "ω", "&thetasym;": "ϑ", "&upsih;": "ϒ", "&piv;": "ϖ", "&bull;": "•", "&hellip;": "…", "&prime;": "′", "&Prime;": "″", "&oline;": "‾", "&frasl;": "⁄", "&weierp;": "℘", "&image;": "ℑ", "&real;": "ℜ", "&trade;": "™", "&alefsym;": "ℵ", "&larr;": "←", "&uarr;": "↑", "&rarr;": "→", "&darr;": "↓", "&harr;": "↔", "&crarr;": "↵", "&lArr;": "⇐", "&uArr;": "⇑", "&rArr;": "⇒", "&dArr;": "⇓", "&hArr;": "⇔", "&forall;": "∀", "&part;": "∂", "&exist;": "∃", "&empty;": "∅", "&nabla;": "∇", "&isin;": "∈", "&notin;": "∉", "&ni;": "∋", "&prod;": "∏", "&sum;": "∑", "&minus;": "−", "&lowast;": "∗", "&radic;": "√", "&prop;": "∝", "&infin;": "∞", "&ang;": "∠", "&and;": "∧", "&or;": "∨", "&cap;": "∩", "&cup;": "∪", "&int;": "∫", "&there4;": "∴", "&sim;": "∼", "&cong;": "≅", "&asymp;": "≈", "&ne;": "≠", "&equiv;": "≡", "&le;": "≤", "&ge;": "≥", "&sub;": "⊂", "&sup;": "⊃", "&nsub;": "⊄", "&sube;": "⊆", "&supe;": "⊇", "&oplus;": "⊕", "&otimes;": "⊗", "&perp;": "⊥", "&sdot;": "⋅", "&lceil;": "⌈", "&rceil;": "⌉", "&lfloor;": "⌊", "&rfloor;": "⌋", "&lang;": "〈", "&rang;": "〉", "&loz;": "◊", "&spades;": "♠", "&clubs;": "♣", "&hearts;": "♥", "&diams;": "♦" }, characters: { "'": "&apos;", " ": "&nbsp;", "¡": "&iexcl;", "¢": "&cent;", "£": "&pound;", "¤": "&curren;", "¥": "&yen;", "¦": "&brvbar;", "§": "&sect;", "¨": "&uml;", "©": "&copy;", "ª": "&ordf;", "«": "&laquo;", "¬": "&not;", "­": "&shy;", "®": "&reg;", "¯": "&macr;", "°": "&deg;", "±": "&plusmn;", "²": "&sup2;", "³": "&sup3;", "´": "&acute;", "µ": "&micro;", "¶": "&para;", "·": "&middot;", "¸": "&cedil;", "¹": "&sup1;", "º": "&ordm;", "»": "&raquo;", "¼": "&frac14;", "½": "&frac12;", "¾": "&frac34;", "¿": "&iquest;", "À": "&Agrave;", "Á": "&Aacute;", "Â": "&Acirc;", "Ã": "&Atilde;", "Ä": "&Auml;", "Å": "&Aring;", "Æ": "&AElig;", "Ç": "&Ccedil;", "È": "&Egrave;", "É": "&Eacute;", "Ê": "&Ecirc;", "Ë": "&Euml;", "Ì": "&Igrave;", "Í": "&Iacute;", "Î": "&Icirc;", "Ï": "&Iuml;", "Ð": "&ETH;", "Ñ": "&Ntilde;", "Ò": "&Ograve;", "Ó": "&Oacute;", "Ô": "&Ocirc;", "Õ": "&Otilde;", "Ö": "&Ouml;", "×": "&times;", "Ø": "&Oslash;", "Ù": "&Ugrave;", "Ú": "&Uacute;", "Û": "&Ucirc;", "Ü": "&Uuml;", "Ý": "&Yacute;", "Þ": "&THORN;", "ß": "&szlig;", "à": "&agrave;", "á": "&aacute;", "â": "&acirc;", "ã": "&atilde;", "ä": "&auml;", "å": "&aring;", "æ": "&aelig;", "ç": "&ccedil;", "è": "&egrave;", "é": "&eacute;", "ê": "&ecirc;", "ë": "&euml;", "ì": "&igrave;", "í": "&iacute;", "î": "&icirc;", "ï": "&iuml;", "ð": "&eth;", "ñ": "&ntilde;", "ò": "&ograve;", "ó": "&oacute;", "ô": "&ocirc;", "õ": "&otilde;", "ö": "&ouml;", "÷": "&divide;", "ø": "&oslash;", "ù": "&ugrave;", "ú": "&uacute;", "û": "&ucirc;", "ü": "&uuml;", "ý": "&yacute;", "þ": "&thorn;", "ÿ": "&yuml;", '"': "&quot;", "&": "&amp;", "<": "&lt;", ">": "&gt;", "Œ": "&OElig;", "œ": "&oelig;", "Š": "&Scaron;", "š": "&scaron;", "Ÿ": "&Yuml;", "ˆ": "&circ;", "˜": "&tilde;", " ": "&ensp;", " ": "&emsp;", " ": "&thinsp;", "‌": "&zwnj;", "‍": "&zwj;", "‎": "&lrm;", "‏": "&rlm;", "–": "&ndash;", "—": "&mdash;", "‘": "&lsquo;", "’": "&rsquo;", "‚": "&sbquo;", "“": "&ldquo;", "”": "&rdquo;", "„": "&bdquo;", "†": "&dagger;", "‡": "&Dagger;", "‰": "&permil;", "‹": "&lsaquo;", "›": "&rsaquo;", "€": "&euro;", "ƒ": "&fnof;", "Α": "&Alpha;", "Β": "&Beta;", "Γ": "&Gamma;", "Δ": "&Delta;", "Ε": "&Epsilon;", "Ζ": "&Zeta;", "Η": "&Eta;", "Θ": "&Theta;", "Ι": "&Iota;", "Κ": "&Kappa;", "Λ": "&Lambda;", "Μ": "&Mu;", "Ν": "&Nu;", "Ξ": "&Xi;", "Ο": "&Omicron;", "Π": "&Pi;", "Ρ": "&Rho;", "Σ": "&Sigma;", "Τ": "&Tau;", "Υ": "&Upsilon;", "Φ": "&Phi;", "Χ": "&Chi;", "Ψ": "&Psi;", "Ω": "&Omega;", "α": "&alpha;", "β": "&beta;", "γ": "&gamma;", "δ": "&delta;", "ε": "&epsilon;", "ζ": "&zeta;", "η": "&eta;", "θ": "&theta;", "ι": "&iota;", "κ": "&kappa;", "λ": "&lambda;", "μ": "&mu;", "ν": "&nu;", "ξ": "&xi;", "ο": "&omicron;", "π": "&pi;", "ρ": "&rho;", "ς": "&sigmaf;", "σ": "&sigma;", "τ": "&tau;", "υ": "&upsilon;", "φ": "&phi;", "χ": "&chi;", "ψ": "&psi;", "ω": "&omega;", "ϑ": "&thetasym;", "ϒ": "&upsih;", "ϖ": "&piv;", "•": "&bull;", "…": "&hellip;", "′": "&prime;", "″": "&Prime;", "‾": "&oline;", "⁄": "&frasl;", "℘": "&weierp;", "ℑ": "&image;", "ℜ": "&real;", "™": "&trade;", "ℵ": "&alefsym;", "←": "&larr;", "↑": "&uarr;", "→": "&rarr;", "↓": "&darr;", "↔": "&harr;", "↵": "&crarr;", "⇐": "&lArr;", "⇑": "&uArr;", "⇒": "&rArr;", "⇓": "&dArr;", "⇔": "&hArr;", "∀": "&forall;", "∂": "&part;", "∃": "&exist;", "∅": "&empty;", "∇": "&nabla;", "∈": "&isin;", "∉": "&notin;", "∋": "&ni;", "∏": "&prod;", "∑": "&sum;", "−": "&minus;", "∗": "&lowast;", "√": "&radic;", "∝": "&prop;", "∞": "&infin;", "∠": "&ang;", "∧": "&and;", "∨": "&or;", "∩": "&cap;", "∪": "&cup;", "∫": "&int;", "∴": "&there4;", "∼": "&sim;", "≅": "&cong;", "≈": "&asymp;", "≠": "&ne;", "≡": "&equiv;", "≤": "&le;", "≥": "&ge;", "⊂": "&sub;", "⊃": "&sup;", "⊄": "&nsub;", "⊆": "&sube;", "⊇": "&supe;", "⊕": "&oplus;", "⊗": "&otimes;", "⊥": "&perp;", "⋅": "&sdot;", "⌈": "&lceil;", "⌉": "&rceil;", "⌊": "&lfloor;", "⌋": "&rfloor;", "〈": "&lang;", "〉": "&rang;", "◊": "&loz;", "♠": "&spades;", "♣": "&clubs;", "♥": "&hearts;", "♦": "&diams;" } }, html5: { entities: { "&AElig": "Æ", "&AElig;": "Æ", "&AMP": "&", "&AMP;": "&", "&Aacute": "Á", "&Aacute;": "Á", "&Abreve;": "Ă", "&Acirc": "Â", "&Acirc;": "Â", "&Acy;": "А", "&Afr;": "𝔄", "&Agrave": "À", "&Agrave;": "À", "&Alpha;": "Α", "&Amacr;": "Ā", "&And;": "⩓", "&Aogon;": "Ą", "&Aopf;": "𝔸", "&ApplyFunction;": "⁡", "&Aring": "Å", "&Aring;": "Å", "&Ascr;": "𝒜", "&Assign;": "≔", "&Atilde": "Ã", "&Atilde;": "Ã", "&Auml": "Ä", "&Auml;": "Ä", "&Backslash;": "∖", "&Barv;": "⫧", "&Barwed;": "⌆", "&Bcy;": "Б", "&Because;": "∵", "&Bernoullis;": "ℬ", "&Beta;": "Β", "&Bfr;": "𝔅", "&Bopf;": "𝔹", "&Breve;": "˘", "&Bscr;": "ℬ", "&Bumpeq;": "≎", "&CHcy;": "Ч", "&COPY": "©", "&COPY;": "©", "&Cacute;": "Ć", "&Cap;": "⋒", "&CapitalDifferentialD;": "ⅅ", "&Cayleys;": "ℭ", "&Ccaron;": "Č", "&Ccedil": "Ç", "&Ccedil;": "Ç", "&Ccirc;": "Ĉ", "&Cconint;": "∰", "&Cdot;": "Ċ", "&Cedilla;": "¸", "&CenterDot;": "·", "&Cfr;": "ℭ", "&Chi;": "Χ", "&CircleDot;": "⊙", "&CircleMinus;": "⊖", "&CirclePlus;": "⊕", "&CircleTimes;": "⊗", "&ClockwiseContourIntegral;": "∲", "&CloseCurlyDoubleQuote;": "”", "&CloseCurlyQuote;": "’", "&Colon;": "∷", "&Colone;": "⩴", "&Congruent;": "≡", "&Conint;": "∯", "&ContourIntegral;": "∮", "&Copf;": "ℂ", "&Coproduct;": "∐", "&CounterClockwiseContourIntegral;": "∳", "&Cross;": "⨯", "&Cscr;": "𝒞", "&Cup;": "⋓", "&CupCap;": "≍", "&DD;": "ⅅ", "&DDotrahd;": "⤑", "&DJcy;": "Ђ", "&DScy;": "Ѕ", "&DZcy;": "Џ", "&Dagger;": "‡", "&Darr;": "↡", "&Dashv;": "⫤", "&Dcaron;": "Ď", "&Dcy;": "Д", "&Del;": "∇", "&Delta;": "Δ", "&Dfr;": "𝔇", "&DiacriticalAcute;": "´", "&DiacriticalDot;": "˙", "&DiacriticalDoubleAcute;": "˝", "&DiacriticalGrave;": "`", "&DiacriticalTilde;": "˜", "&Diamond;": "⋄", "&DifferentialD;": "ⅆ", "&Dopf;": "𝔻", "&Dot;": "¨", "&DotDot;": "⃜", "&DotEqual;": "≐", "&DoubleContourIntegral;": "∯", "&DoubleDot;": "¨", "&DoubleDownArrow;": "⇓", "&DoubleLeftArrow;": "⇐", "&DoubleLeftRightArrow;": "⇔", "&DoubleLeftTee;": "⫤", "&DoubleLongLeftArrow;": "⟸", "&DoubleLongLeftRightArrow;": "⟺", "&DoubleLongRightArrow;": "⟹", "&DoubleRightArrow;": "⇒", "&DoubleRightTee;": "⊨", "&DoubleUpArrow;": "⇑", "&DoubleUpDownArrow;": "⇕", "&DoubleVerticalBar;": "∥", "&DownArrow;": "↓", "&DownArrowBar;": "⤓", "&DownArrowUpArrow;": "⇵", "&DownBreve;": "̑", "&DownLeftRightVector;": "⥐", "&DownLeftTeeVector;": "⥞", "&DownLeftVector;": "↽", "&DownLeftVectorBar;": "⥖", "&DownRightTeeVector;": "⥟", "&DownRightVector;": "⇁", "&DownRightVectorBar;": "⥗", "&DownTee;": "⊤", "&DownTeeArrow;": "↧", "&Downarrow;": "⇓", "&Dscr;": "𝒟", "&Dstrok;": "Đ", "&ENG;": "Ŋ", "&ETH": "Ð", "&ETH;": "Ð", "&Eacute": "É", "&Eacute;": "É", "&Ecaron;": "Ě", "&Ecirc": "Ê", "&Ecirc;": "Ê", "&Ecy;": "Э", "&Edot;": "Ė", "&Efr;": "𝔈", "&Egrave": "È", "&Egrave;": "È", "&Element;": "∈", "&Emacr;": "Ē", "&EmptySmallSquare;": "◻", "&EmptyVerySmallSquare;": "▫", "&Eogon;": "Ę", "&Eopf;": "𝔼", "&Epsilon;": "Ε", "&Equal;": "⩵", "&EqualTilde;": "≂", "&Equilibrium;": "⇌", "&Escr;": "ℰ", "&Esim;": "⩳", "&Eta;": "Η", "&Euml": "Ë", "&Euml;": "Ë", "&Exists;": "∃", "&ExponentialE;": "ⅇ", "&Fcy;": "Ф", "&Ffr;": "𝔉", "&FilledSmallSquare;": "◼", "&FilledVerySmallSquare;": "▪", "&Fopf;": "𝔽", "&ForAll;": "∀", "&Fouriertrf;": "ℱ", "&Fscr;": "ℱ", "&GJcy;": "Ѓ", "&GT": ">", "&GT;": ">", "&Gamma;": "Γ", "&Gammad;": "Ϝ", "&Gbreve;": "Ğ", "&Gcedil;": "Ģ", "&Gcirc;": "Ĝ", "&Gcy;": "Г", "&Gdot;": "Ġ", "&Gfr;": "𝔊", "&Gg;": "⋙", "&Gopf;": "𝔾", "&GreaterEqual;": "≥", "&GreaterEqualLess;": "⋛", "&GreaterFullEqual;": "≧", "&GreaterGreater;": "⪢", "&GreaterLess;": "≷", "&GreaterSlantEqual;": "⩾", "&GreaterTilde;": "≳", "&Gscr;": "𝒢", "&Gt;": "≫", "&HARDcy;": "Ъ", "&Hacek;": "ˇ", "&Hat;": "^", "&Hcirc;": "Ĥ", "&Hfr;": "ℌ", "&HilbertSpace;": "ℋ", "&Hopf;": "ℍ", "&HorizontalLine;": "─", "&Hscr;": "ℋ", "&Hstrok;": "Ħ", "&HumpDownHump;": "≎", "&HumpEqual;": "≏", "&IEcy;": "Е", "&IJlig;": "Ĳ", "&IOcy;": "Ё", "&Iacute": "Í", "&Iacute;": "Í", "&Icirc": "Î", "&Icirc;": "Î", "&Icy;": "И", "&Idot;": "İ", "&Ifr;": "ℑ", "&Igrave": "Ì", "&Igrave;": "Ì", "&Im;": "ℑ", "&Imacr;": "Ī", "&ImaginaryI;": "ⅈ", "&Implies;": "⇒", "&Int;": "∬", "&Integral;": "∫", "&Intersection;": "⋂", "&InvisibleComma;": "⁣", "&InvisibleTimes;": "⁢", "&Iogon;": "Į", "&Iopf;": "𝕀", "&Iota;": "Ι", "&Iscr;": "ℐ", "&Itilde;": "Ĩ", "&Iukcy;": "І", "&Iuml": "Ï", "&Iuml;": "Ï", "&Jcirc;": "Ĵ", "&Jcy;": "Й", "&Jfr;": "𝔍", "&Jopf;": "𝕁", "&Jscr;": "𝒥", "&Jsercy;": "Ј", "&Jukcy;": "Є", "&KHcy;": "Х", "&KJcy;": "Ќ", "&Kappa;": "Κ", "&Kcedil;": "Ķ", "&Kcy;": "К", "&Kfr;": "𝔎", "&Kopf;": "𝕂", "&Kscr;": "𝒦", "&LJcy;": "Љ", "&LT": "<", "&LT;": "<", "&Lacute;": "Ĺ", "&Lambda;": "Λ", "&Lang;": "⟪", "&Laplacetrf;": "ℒ", "&Larr;": "↞", "&Lcaron;": "Ľ", "&Lcedil;": "Ļ", "&Lcy;": "Л", "&LeftAngleBracket;": "⟨", "&LeftArrow;": "←", "&LeftArrowBar;": "⇤", "&LeftArrowRightArrow;": "⇆", "&LeftCeiling;": "⌈", "&LeftDoubleBracket;": "⟦", "&LeftDownTeeVector;": "⥡", "&LeftDownVector;": "⇃", "&LeftDownVectorBar;": "⥙", "&LeftFloor;": "⌊", "&LeftRightArrow;": "↔", "&LeftRightVector;": "⥎", "&LeftTee;": "⊣", "&LeftTeeArrow;": "↤", "&LeftTeeVector;": "⥚", "&LeftTriangle;": "⊲", "&LeftTriangleBar;": "⧏", "&LeftTriangleEqual;": "⊴", "&LeftUpDownVector;": "⥑", "&LeftUpTeeVector;": "⥠", "&LeftUpVector;": "↿", "&LeftUpVectorBar;": "⥘", "&LeftVector;": "↼", "&LeftVectorBar;": "⥒", "&Leftarrow;": "⇐", "&Leftrightarrow;": "⇔", "&LessEqualGreater;": "⋚", "&LessFullEqual;": "≦", "&LessGreater;": "≶", "&LessLess;": "⪡", "&LessSlantEqual;": "⩽", "&LessTilde;": "≲", "&Lfr;": "𝔏", "&Ll;": "⋘", "&Lleftarrow;": "⇚", "&Lmidot;": "Ŀ", "&LongLeftArrow;": "⟵", "&LongLeftRightArrow;": "⟷", "&LongRightArrow;": "⟶", "&Longleftarrow;": "⟸", "&Longleftrightarrow;": "⟺", "&Longrightarrow;": "⟹", "&Lopf;": "𝕃", "&LowerLeftArrow;": "↙", "&LowerRightArrow;": "↘", "&Lscr;": "ℒ", "&Lsh;": "↰", "&Lstrok;": "Ł", "&Lt;": "≪", "&Map;": "⤅", "&Mcy;": "М", "&MediumSpace;": " ", "&Mellintrf;": "ℳ", "&Mfr;": "𝔐", "&MinusPlus;": "∓", "&Mopf;": "𝕄", "&Mscr;": "ℳ", "&Mu;": "Μ", "&NJcy;": "Њ", "&Nacute;": "Ń", "&Ncaron;": "Ň", "&Ncedil;": "Ņ", "&Ncy;": "Н", "&NegativeMediumSpace;": "​", "&NegativeThickSpace;": "​", "&NegativeThinSpace;": "​", "&NegativeVeryThinSpace;": "​", "&NestedGreaterGreater;": "≫", "&NestedLessLess;": "≪", "&NewLine;": "\n", "&Nfr;": "𝔑", "&NoBreak;": "⁠", "&NonBreakingSpace;": " ", "&Nopf;": "ℕ", "&Not;": "⫬", "&NotCongruent;": "≢", "&NotCupCap;": "≭", "&NotDoubleVerticalBar;": "∦", "&NotElement;": "∉", "&NotEqual;": "≠", "&NotEqualTilde;": "≂̸", "&NotExists;": "∄", "&NotGreater;": "≯", "&NotGreaterEqual;": "≱", "&NotGreaterFullEqual;": "≧̸", "&NotGreaterGreater;": "≫̸", "&NotGreaterLess;": "≹", "&NotGreaterSlantEqual;": "⩾̸", "&NotGreaterTilde;": "≵", "&NotHumpDownHump;": "≎̸", "&NotHumpEqual;": "≏̸", "&NotLeftTriangle;": "⋪", "&NotLeftTriangleBar;": "⧏̸", "&NotLeftTriangleEqual;": "⋬", "&NotLess;": "≮", "&NotLessEqual;": "≰", "&NotLessGreater;": "≸", "&NotLessLess;": "≪̸", "&NotLessSlantEqual;": "⩽̸", "&NotLessTilde;": "≴", "&NotNestedGreaterGreater;": "⪢̸", "&NotNestedLessLess;": "⪡̸", "&NotPrecedes;": "⊀", "&NotPrecedesEqual;": "⪯̸", "&NotPrecedesSlantEqual;": "⋠", "&NotReverseElement;": "∌", "&NotRightTriangle;": "⋫", "&NotRightTriangleBar;": "⧐̸", "&NotRightTriangleEqual;": "⋭", "&NotSquareSubset;": "⊏̸", "&NotSquareSubsetEqual;": "⋢", "&NotSquareSuperset;": "⊐̸", "&NotSquareSupersetEqual;": "⋣", "&NotSubset;": "⊂⃒", "&NotSubsetEqual;": "⊈", "&NotSucceeds;": "⊁", "&NotSucceedsEqual;": "⪰̸", "&NotSucceedsSlantEqual;": "⋡", "&NotSucceedsTilde;": "≿̸", "&NotSuperset;": "⊃⃒", "&NotSupersetEqual;": "⊉", "&NotTilde;": "≁", "&NotTildeEqual;": "≄", "&NotTildeFullEqual;": "≇", "&NotTildeTilde;": "≉", "&NotVerticalBar;": "∤", "&Nscr;": "𝒩", "&Ntilde": "Ñ", "&Ntilde;": "Ñ", "&Nu;": "Ν", "&OElig;": "Œ", "&Oacute": "Ó", "&Oacute;": "Ó", "&Ocirc": "Ô", "&Ocirc;": "Ô", "&Ocy;": "О", "&Odblac;": "Ő", "&Ofr;": "𝔒", "&Ograve": "Ò", "&Ograve;": "Ò", "&Omacr;": "Ō", "&Omega;": "Ω", "&Omicron;": "Ο", "&Oopf;": "𝕆", "&OpenCurlyDoubleQuote;": "“", "&OpenCurlyQuote;": "‘", "&Or;": "⩔", "&Oscr;": "𝒪", "&Oslash": "Ø", "&Oslash;": "Ø", "&Otilde": "Õ", "&Otilde;": "Õ", "&Otimes;": "⨷", "&Ouml": "Ö", "&Ouml;": "Ö", "&OverBar;": "‾", "&OverBrace;": "⏞", "&OverBracket;": "⎴", "&OverParenthesis;": "⏜", "&PartialD;": "∂", "&Pcy;": "П", "&Pfr;": "𝔓", "&Phi;": "Φ", "&Pi;": "Π", "&PlusMinus;": "±", "&Poincareplane;": "ℌ", "&Popf;": "ℙ", "&Pr;": "⪻", "&Precedes;": "≺", "&PrecedesEqual;": "⪯", "&PrecedesSlantEqual;": "≼", "&PrecedesTilde;": "≾", "&Prime;": "″", "&Product;": "∏", "&Proportion;": "∷", "&Proportional;": "∝", "&Pscr;": "𝒫", "&Psi;": "Ψ", "&QUOT": '"', "&QUOT;": '"', "&Qfr;": "𝔔", "&Qopf;": "ℚ", "&Qscr;": "𝒬", "&RBarr;": "⤐", "&REG": "®", "&REG;": "®", "&Racute;": "Ŕ", "&Rang;": "⟫", "&Rarr;": "↠", "&Rarrtl;": "⤖", "&Rcaron;": "Ř", "&Rcedil;": "Ŗ", "&Rcy;": "Р", "&Re;": "ℜ", "&ReverseElement;": "∋", "&ReverseEquilibrium;": "⇋", "&ReverseUpEquilibrium;": "⥯", "&Rfr;": "ℜ", "&Rho;": "Ρ", "&RightAngleBracket;": "⟩", "&RightArrow;": "→", "&RightArrowBar;": "⇥", "&RightArrowLeftArrow;": "⇄", "&RightCeiling;": "⌉", "&RightDoubleBracket;": "⟧", "&RightDownTeeVector;": "⥝", "&RightDownVector;": "⇂", "&RightDownVectorBar;": "⥕", "&RightFloor;": "⌋", "&RightTee;": "⊢", "&RightTeeArrow;": "↦", "&RightTeeVector;": "⥛", "&RightTriangle;": "⊳", "&RightTriangleBar;": "⧐", "&RightTriangleEqual;": "⊵", "&RightUpDownVector;": "⥏", "&RightUpTeeVector;": "⥜", "&RightUpVector;": "↾", "&RightUpVectorBar;": "⥔", "&RightVector;": "⇀", "&RightVectorBar;": "⥓", "&Rightarrow;": "⇒", "&Ropf;": "ℝ", "&RoundImplies;": "⥰", "&Rrightarrow;": "⇛", "&Rscr;": "ℛ", "&Rsh;": "↱", "&RuleDelayed;": "⧴", "&SHCHcy;": "Щ", "&SHcy;": "Ш", "&SOFTcy;": "Ь", "&Sacute;": "Ś", "&Sc;": "⪼", "&Scaron;": "Š", "&Scedil;": "Ş", "&Scirc;": "Ŝ", "&Scy;": "С", "&Sfr;": "𝔖", "&ShortDownArrow;": "↓", "&ShortLeftArrow;": "←", "&ShortRightArrow;": "→", "&ShortUpArrow;": "↑", "&Sigma;": "Σ", "&SmallCircle;": "∘", "&Sopf;": "𝕊", "&Sqrt;": "√", "&Square;": "□", "&SquareIntersection;": "⊓", "&SquareSubset;": "⊏", "&SquareSubsetEqual;": "⊑", "&SquareSuperset;": "⊐", "&SquareSupersetEqual;": "⊒", "&SquareUnion;": "⊔", "&Sscr;": "𝒮", "&Star;": "⋆", "&Sub;": "⋐", "&Subset;": "⋐", "&SubsetEqual;": "⊆", "&Succeeds;": "≻", "&SucceedsEqual;": "⪰", "&SucceedsSlantEqual;": "≽", "&SucceedsTilde;": "≿", "&SuchThat;": "∋", "&Sum;": "∑", "&Sup;": "⋑", "&Superset;": "⊃", "&SupersetEqual;": "⊇", "&Supset;": "⋑", "&THORN": "Þ", "&THORN;": "Þ", "&TRADE;": "™", "&TSHcy;": "Ћ", "&TScy;": "Ц", "&Tab;": "	", "&Tau;": "Τ", "&Tcaron;": "Ť", "&Tcedil;": "Ţ", "&Tcy;": "Т", "&Tfr;": "𝔗", "&Therefore;": "∴", "&Theta;": "Θ", "&ThickSpace;": "  ", "&ThinSpace;": " ", "&Tilde;": "∼", "&TildeEqual;": "≃", "&TildeFullEqual;": "≅", "&TildeTilde;": "≈", "&Topf;": "𝕋", "&TripleDot;": "⃛", "&Tscr;": "𝒯", "&Tstrok;": "Ŧ", "&Uacute": "Ú", "&Uacute;": "Ú", "&Uarr;": "↟", "&Uarrocir;": "⥉", "&Ubrcy;": "Ў", "&Ubreve;": "Ŭ", "&Ucirc": "Û", "&Ucirc;": "Û", "&Ucy;": "У", "&Udblac;": "Ű", "&Ufr;": "𝔘", "&Ugrave": "Ù", "&Ugrave;": "Ù", "&Umacr;": "Ū", "&UnderBar;": "_", "&UnderBrace;": "⏟", "&UnderBracket;": "⎵", "&UnderParenthesis;": "⏝", "&Union;": "⋃", "&UnionPlus;": "⊎", "&Uogon;": "Ų", "&Uopf;": "𝕌", "&UpArrow;": "↑", "&UpArrowBar;": "⤒", "&UpArrowDownArrow;": "⇅", "&UpDownArrow;": "↕", "&UpEquilibrium;": "⥮", "&UpTee;": "⊥", "&UpTeeArrow;": "↥", "&Uparrow;": "⇑", "&Updownarrow;": "⇕", "&UpperLeftArrow;": "↖", "&UpperRightArrow;": "↗", "&Upsi;": "ϒ", "&Upsilon;": "Υ", "&Uring;": "Ů", "&Uscr;": "𝒰", "&Utilde;": "Ũ", "&Uuml": "Ü", "&Uuml;": "Ü", "&VDash;": "⊫", "&Vbar;": "⫫", "&Vcy;": "В", "&Vdash;": "⊩", "&Vdashl;": "⫦", "&Vee;": "⋁", "&Verbar;": "‖", "&Vert;": "‖", "&VerticalBar;": "∣", "&VerticalLine;": "|", "&VerticalSeparator;": "❘", "&VerticalTilde;": "≀", "&VeryThinSpace;": " ", "&Vfr;": "𝔙", "&Vopf;": "𝕍", "&Vscr;": "𝒱", "&Vvdash;": "⊪", "&Wcirc;": "Ŵ", "&Wedge;": "⋀", "&Wfr;": "𝔚", "&Wopf;": "𝕎", "&Wscr;": "𝒲", "&Xfr;": "𝔛", "&Xi;": "Ξ", "&Xopf;": "𝕏", "&Xscr;": "𝒳", "&YAcy;": "Я", "&YIcy;": "Ї", "&YUcy;": "Ю", "&Yacute": "Ý", "&Yacute;": "Ý", "&Ycirc;": "Ŷ", "&Ycy;": "Ы", "&Yfr;": "𝔜", "&Yopf;": "𝕐", "&Yscr;": "𝒴", "&Yuml;": "Ÿ", "&ZHcy;": "Ж", "&Zacute;": "Ź", "&Zcaron;": "Ž", "&Zcy;": "З", "&Zdot;": "Ż", "&ZeroWidthSpace;": "​", "&Zeta;": "Ζ", "&Zfr;": "ℨ", "&Zopf;": "ℤ", "&Zscr;": "𝒵", "&aacute": "á", "&aacute;": "á", "&abreve;": "ă", "&ac;": "∾", "&acE;": "∾̳", "&acd;": "∿", "&acirc": "â", "&acirc;": "â", "&acute": "´", "&acute;": "´", "&acy;": "а", "&aelig": "æ", "&aelig;": "æ", "&af;": "⁡", "&afr;": "𝔞", "&agrave": "à", "&agrave;": "à", "&alefsym;": "ℵ", "&aleph;": "ℵ", "&alpha;": "α", "&amacr;": "ā", "&amalg;": "⨿", "&amp": "&", "&amp;": "&", "&and;": "∧", "&andand;": "⩕", "&andd;": "⩜", "&andslope;": "⩘", "&andv;": "⩚", "&ang;": "∠", "&ange;": "⦤", "&angle;": "∠", "&angmsd;": "∡", "&angmsdaa;": "⦨", "&angmsdab;": "⦩", "&angmsdac;": "⦪", "&angmsdad;": "⦫", "&angmsdae;": "⦬", "&angmsdaf;": "⦭", "&angmsdag;": "⦮", "&angmsdah;": "⦯", "&angrt;": "∟", "&angrtvb;": "⊾", "&angrtvbd;": "⦝", "&angsph;": "∢", "&angst;": "Å", "&angzarr;": "⍼", "&aogon;": "ą", "&aopf;": "𝕒", "&ap;": "≈", "&apE;": "⩰", "&apacir;": "⩯", "&ape;": "≊", "&apid;": "≋", "&apos;": "'", "&approx;": "≈", "&approxeq;": "≊", "&aring": "å", "&aring;": "å", "&ascr;": "𝒶", "&ast;": "*", "&asymp;": "≈", "&asympeq;": "≍", "&atilde": "ã", "&atilde;": "ã", "&auml": "ä", "&auml;": "ä", "&awconint;": "∳", "&awint;": "⨑", "&bNot;": "⫭", "&backcong;": "≌", "&backepsilon;": "϶", "&backprime;": "‵", "&backsim;": "∽", "&backsimeq;": "⋍", "&barvee;": "⊽", "&barwed;": "⌅", "&barwedge;": "⌅", "&bbrk;": "⎵", "&bbrktbrk;": "⎶", "&bcong;": "≌", "&bcy;": "б", "&bdquo;": "„", "&becaus;": "∵", "&because;": "∵", "&bemptyv;": "⦰", "&bepsi;": "϶", "&bernou;": "ℬ", "&beta;": "β", "&beth;": "ℶ", "&between;": "≬", "&bfr;": "𝔟", "&bigcap;": "⋂", "&bigcirc;": "◯", "&bigcup;": "⋃", "&bigodot;": "⨀", "&bigoplus;": "⨁", "&bigotimes;": "⨂", "&bigsqcup;": "⨆", "&bigstar;": "★", "&bigtriangledown;": "▽", "&bigtriangleup;": "△", "&biguplus;": "⨄", "&bigvee;": "⋁", "&bigwedge;": "⋀", "&bkarow;": "⤍", "&blacklozenge;": "⧫", "&blacksquare;": "▪", "&blacktriangle;": "▴", "&blacktriangledown;": "▾", "&blacktriangleleft;": "◂", "&blacktriangleright;": "▸", "&blank;": "␣", "&blk12;": "▒", "&blk14;": "░", "&blk34;": "▓", "&block;": "█", "&bne;": "=⃥", "&bnequiv;": "≡⃥", "&bnot;": "⌐", "&bopf;": "𝕓", "&bot;": "⊥", "&bottom;": "⊥", "&bowtie;": "⋈", "&boxDL;": "╗", "&boxDR;": "╔", "&boxDl;": "╖", "&boxDr;": "╓", "&boxH;": "═", "&boxHD;": "╦", "&boxHU;": "╩", "&boxHd;": "╤", "&boxHu;": "╧", "&boxUL;": "╝", "&boxUR;": "╚", "&boxUl;": "╜", "&boxUr;": "╙", "&boxV;": "║", "&boxVH;": "╬", "&boxVL;": "╣", "&boxVR;": "╠", "&boxVh;": "╫", "&boxVl;": "╢", "&boxVr;": "╟", "&boxbox;": "⧉", "&boxdL;": "╕", "&boxdR;": "╒", "&boxdl;": "┐", "&boxdr;": "┌", "&boxh;": "─", "&boxhD;": "╥", "&boxhU;": "╨", "&boxhd;": "┬", "&boxhu;": "┴", "&boxminus;": "⊟", "&boxplus;": "⊞", "&boxtimes;": "⊠", "&boxuL;": "╛", "&boxuR;": "╘", "&boxul;": "┘", "&boxur;": "└", "&boxv;": "│", "&boxvH;": "╪", "&boxvL;": "╡", "&boxvR;": "╞", "&boxvh;": "┼", "&boxvl;": "┤", "&boxvr;": "├", "&bprime;": "‵", "&breve;": "˘", "&brvbar": "¦", "&brvbar;": "¦", "&bscr;": "𝒷", "&bsemi;": "⁏", "&bsim;": "∽", "&bsime;": "⋍", "&bsol;": "\\", "&bsolb;": "⧅", "&bsolhsub;": "⟈", "&bull;": "•", "&bullet;": "•", "&bump;": "≎", "&bumpE;": "⪮", "&bumpe;": "≏", "&bumpeq;": "≏", "&cacute;": "ć", "&cap;": "∩", "&capand;": "⩄", "&capbrcup;": "⩉", "&capcap;": "⩋", "&capcup;": "⩇", "&capdot;": "⩀", "&caps;": "∩︀", "&caret;": "⁁", "&caron;": "ˇ", "&ccaps;": "⩍", "&ccaron;": "č", "&ccedil": "ç", "&ccedil;": "ç", "&ccirc;": "ĉ", "&ccups;": "⩌", "&ccupssm;": "⩐", "&cdot;": "ċ", "&cedil": "¸", "&cedil;": "¸", "&cemptyv;": "⦲", "&cent": "¢", "&cent;": "¢", "&centerdot;": "·", "&cfr;": "𝔠", "&chcy;": "ч", "&check;": "✓", "&checkmark;": "✓", "&chi;": "χ", "&cir;": "○", "&cirE;": "⧃", "&circ;": "ˆ", "&circeq;": "≗", "&circlearrowleft;": "↺", "&circlearrowright;": "↻", "&circledR;": "®", "&circledS;": "Ⓢ", "&circledast;": "⊛", "&circledcirc;": "⊚", "&circleddash;": "⊝", "&cire;": "≗", "&cirfnint;": "⨐", "&cirmid;": "⫯", "&cirscir;": "⧂", "&clubs;": "♣", "&clubsuit;": "♣", "&colon;": ":", "&colone;": "≔", "&coloneq;": "≔", "&comma;": ",", "&commat;": "@", "&comp;": "∁", "&compfn;": "∘", "&complement;": "∁", "&complexes;": "ℂ", "&cong;": "≅", "&congdot;": "⩭", "&conint;": "∮", "&copf;": "𝕔", "&coprod;": "∐", "&copy": "©", "&copy;": "©", "&copysr;": "℗", "&crarr;": "↵", "&cross;": "✗", "&cscr;": "𝒸", "&csub;": "⫏", "&csube;": "⫑", "&csup;": "⫐", "&csupe;": "⫒", "&ctdot;": "⋯", "&cudarrl;": "⤸", "&cudarrr;": "⤵", "&cuepr;": "⋞", "&cuesc;": "⋟", "&cularr;": "↶", "&cularrp;": "⤽", "&cup;": "∪", "&cupbrcap;": "⩈", "&cupcap;": "⩆", "&cupcup;": "⩊", "&cupdot;": "⊍", "&cupor;": "⩅", "&cups;": "∪︀", "&curarr;": "↷", "&curarrm;": "⤼", "&curlyeqprec;": "⋞", "&curlyeqsucc;": "⋟", "&curlyvee;": "⋎", "&curlywedge;": "⋏", "&curren": "¤", "&curren;": "¤", "&curvearrowleft;": "↶", "&curvearrowright;": "↷", "&cuvee;": "⋎", "&cuwed;": "⋏", "&cwconint;": "∲", "&cwint;": "∱", "&cylcty;": "⌭", "&dArr;": "⇓", "&dHar;": "⥥", "&dagger;": "†", "&daleth;": "ℸ", "&darr;": "↓", "&dash;": "‐", "&dashv;": "⊣", "&dbkarow;": "⤏", "&dblac;": "˝", "&dcaron;": "ď", "&dcy;": "д", "&dd;": "ⅆ", "&ddagger;": "‡", "&ddarr;": "⇊", "&ddotseq;": "⩷", "&deg": "°", "&deg;": "°", "&delta;": "δ", "&demptyv;": "⦱", "&dfisht;": "⥿", "&dfr;": "𝔡", "&dharl;": "⇃", "&dharr;": "⇂", "&diam;": "⋄", "&diamond;": "⋄", "&diamondsuit;": "♦", "&diams;": "♦", "&die;": "¨", "&digamma;": "ϝ", "&disin;": "⋲", "&div;": "÷", "&divide": "÷", "&divide;": "÷", "&divideontimes;": "⋇", "&divonx;": "⋇", "&djcy;": "ђ", "&dlcorn;": "⌞", "&dlcrop;": "⌍", "&dollar;": "$", "&dopf;": "𝕕", "&dot;": "˙", "&doteq;": "≐", "&doteqdot;": "≑", "&dotminus;": "∸", "&dotplus;": "∔", "&dotsquare;": "⊡", "&doublebarwedge;": "⌆", "&downarrow;": "↓", "&downdownarrows;": "⇊", "&downharpoonleft;": "⇃", "&downharpoonright;": "⇂", "&drbkarow;": "⤐", "&drcorn;": "⌟", "&drcrop;": "⌌", "&dscr;": "𝒹", "&dscy;": "ѕ", "&dsol;": "⧶", "&dstrok;": "đ", "&dtdot;": "⋱", "&dtri;": "▿", "&dtrif;": "▾", "&duarr;": "⇵", "&duhar;": "⥯", "&dwangle;": "⦦", "&dzcy;": "џ", "&dzigrarr;": "⟿", "&eDDot;": "⩷", "&eDot;": "≑", "&eacute": "é", "&eacute;": "é", "&easter;": "⩮", "&ecaron;": "ě", "&ecir;": "≖", "&ecirc": "ê", "&ecirc;": "ê", "&ecolon;": "≕", "&ecy;": "э", "&edot;": "ė", "&ee;": "ⅇ", "&efDot;": "≒", "&efr;": "𝔢", "&eg;": "⪚", "&egrave": "è", "&egrave;": "è", "&egs;": "⪖", "&egsdot;": "⪘", "&el;": "⪙", "&elinters;": "⏧", "&ell;": "ℓ", "&els;": "⪕", "&elsdot;": "⪗", "&emacr;": "ē", "&empty;": "∅", "&emptyset;": "∅", "&emptyv;": "∅", "&emsp13;": " ", "&emsp14;": " ", "&emsp;": " ", "&eng;": "ŋ", "&ensp;": " ", "&eogon;": "ę", "&eopf;": "𝕖", "&epar;": "⋕", "&eparsl;": "⧣", "&eplus;": "⩱", "&epsi;": "ε", "&epsilon;": "ε", "&epsiv;": "ϵ", "&eqcirc;": "≖", "&eqcolon;": "≕", "&eqsim;": "≂", "&eqslantgtr;": "⪖", "&eqslantless;": "⪕", "&equals;": "=", "&equest;": "≟", "&equiv;": "≡", "&equivDD;": "⩸", "&eqvparsl;": "⧥", "&erDot;": "≓", "&erarr;": "⥱", "&escr;": "ℯ", "&esdot;": "≐", "&esim;": "≂", "&eta;": "η", "&eth": "ð", "&eth;": "ð", "&euml": "ë", "&euml;": "ë", "&euro;": "€", "&excl;": "!", "&exist;": "∃", "&expectation;": "ℰ", "&exponentiale;": "ⅇ", "&fallingdotseq;": "≒", "&fcy;": "ф", "&female;": "♀", "&ffilig;": "ﬃ", "&fflig;": "ﬀ", "&ffllig;": "ﬄ", "&ffr;": "𝔣", "&filig;": "ﬁ", "&fjlig;": "fj", "&flat;": "♭", "&fllig;": "ﬂ", "&fltns;": "▱", "&fnof;": "ƒ", "&fopf;": "𝕗", "&forall;": "∀", "&fork;": "⋔", "&forkv;": "⫙", "&fpartint;": "⨍", "&frac12": "½", "&frac12;": "½", "&frac13;": "⅓", "&frac14": "¼", "&frac14;": "¼", "&frac15;": "⅕", "&frac16;": "⅙", "&frac18;": "⅛", "&frac23;": "⅔", "&frac25;": "⅖", "&frac34": "¾", "&frac34;": "¾", "&frac35;": "⅗", "&frac38;": "⅜", "&frac45;": "⅘", "&frac56;": "⅚", "&frac58;": "⅝", "&frac78;": "⅞", "&frasl;": "⁄", "&frown;": "⌢", "&fscr;": "𝒻", "&gE;": "≧", "&gEl;": "⪌", "&gacute;": "ǵ", "&gamma;": "γ", "&gammad;": "ϝ", "&gap;": "⪆", "&gbreve;": "ğ", "&gcirc;": "ĝ", "&gcy;": "г", "&gdot;": "ġ", "&ge;": "≥", "&gel;": "⋛", "&geq;": "≥", "&geqq;": "≧", "&geqslant;": "⩾", "&ges;": "⩾", "&gescc;": "⪩", "&gesdot;": "⪀", "&gesdoto;": "⪂", "&gesdotol;": "⪄", "&gesl;": "⋛︀", "&gesles;": "⪔", "&gfr;": "𝔤", "&gg;": "≫", "&ggg;": "⋙", "&gimel;": "ℷ", "&gjcy;": "ѓ", "&gl;": "≷", "&glE;": "⪒", "&gla;": "⪥", "&glj;": "⪤", "&gnE;": "≩", "&gnap;": "⪊", "&gnapprox;": "⪊", "&gne;": "⪈", "&gneq;": "⪈", "&gneqq;": "≩", "&gnsim;": "⋧", "&gopf;": "𝕘", "&grave;": "`", "&gscr;": "ℊ", "&gsim;": "≳", "&gsime;": "⪎", "&gsiml;": "⪐", "&gt": ">", "&gt;": ">", "&gtcc;": "⪧", "&gtcir;": "⩺", "&gtdot;": "⋗", "&gtlPar;": "⦕", "&gtquest;": "⩼", "&gtrapprox;": "⪆", "&gtrarr;": "⥸", "&gtrdot;": "⋗", "&gtreqless;": "⋛", "&gtreqqless;": "⪌", "&gtrless;": "≷", "&gtrsim;": "≳", "&gvertneqq;": "≩︀", "&gvnE;": "≩︀", "&hArr;": "⇔", "&hairsp;": " ", "&half;": "½", "&hamilt;": "ℋ", "&hardcy;": "ъ", "&harr;": "↔", "&harrcir;": "⥈", "&harrw;": "↭", "&hbar;": "ℏ", "&hcirc;": "ĥ", "&hearts;": "♥", "&heartsuit;": "♥", "&hellip;": "…", "&hercon;": "⊹", "&hfr;": "𝔥", "&hksearow;": "⤥", "&hkswarow;": "⤦", "&hoarr;": "⇿", "&homtht;": "∻", "&hookleftarrow;": "↩", "&hookrightarrow;": "↪", "&hopf;": "𝕙", "&horbar;": "―", "&hscr;": "𝒽", "&hslash;": "ℏ", "&hstrok;": "ħ", "&hybull;": "⁃", "&hyphen;": "‐", "&iacute": "í", "&iacute;": "í", "&ic;": "⁣", "&icirc": "î", "&icirc;": "î", "&icy;": "и", "&iecy;": "е", "&iexcl": "¡", "&iexcl;": "¡", "&iff;": "⇔", "&ifr;": "𝔦", "&igrave": "ì", "&igrave;": "ì", "&ii;": "ⅈ", "&iiiint;": "⨌", "&iiint;": "∭", "&iinfin;": "⧜", "&iiota;": "℩", "&ijlig;": "ĳ", "&imacr;": "ī", "&image;": "ℑ", "&imagline;": "ℐ", "&imagpart;": "ℑ", "&imath;": "ı", "&imof;": "⊷", "&imped;": "Ƶ", "&in;": "∈", "&incare;": "℅", "&infin;": "∞", "&infintie;": "⧝", "&inodot;": "ı", "&int;": "∫", "&intcal;": "⊺", "&integers;": "ℤ", "&intercal;": "⊺", "&intlarhk;": "⨗", "&intprod;": "⨼", "&iocy;": "ё", "&iogon;": "į", "&iopf;": "𝕚", "&iota;": "ι", "&iprod;": "⨼", "&iquest": "¿", "&iquest;": "¿", "&iscr;": "𝒾", "&isin;": "∈", "&isinE;": "⋹", "&isindot;": "⋵", "&isins;": "⋴", "&isinsv;": "⋳", "&isinv;": "∈", "&it;": "⁢", "&itilde;": "ĩ", "&iukcy;": "і", "&iuml": "ï", "&iuml;": "ï", "&jcirc;": "ĵ", "&jcy;": "й", "&jfr;": "𝔧", "&jmath;": "ȷ", "&jopf;": "𝕛", "&jscr;": "𝒿", "&jsercy;": "ј", "&jukcy;": "є", "&kappa;": "κ", "&kappav;": "ϰ", "&kcedil;": "ķ", "&kcy;": "к", "&kfr;": "𝔨", "&kgreen;": "ĸ", "&khcy;": "х", "&kjcy;": "ќ", "&kopf;": "𝕜", "&kscr;": "𝓀", "&lAarr;": "⇚", "&lArr;": "⇐", "&lAtail;": "⤛", "&lBarr;": "⤎", "&lE;": "≦", "&lEg;": "⪋", "&lHar;": "⥢", "&lacute;": "ĺ", "&laemptyv;": "⦴", "&lagran;": "ℒ", "&lambda;": "λ", "&lang;": "⟨", "&langd;": "⦑", "&langle;": "⟨", "&lap;": "⪅", "&laquo": "«", "&laquo;": "«", "&larr;": "←", "&larrb;": "⇤", "&larrbfs;": "⤟", "&larrfs;": "⤝", "&larrhk;": "↩", "&larrlp;": "↫", "&larrpl;": "⤹", "&larrsim;": "⥳", "&larrtl;": "↢", "&lat;": "⪫", "&latail;": "⤙", "&late;": "⪭", "&lates;": "⪭︀", "&lbarr;": "⤌", "&lbbrk;": "❲", "&lbrace;": "{", "&lbrack;": "[", "&lbrke;": "⦋", "&lbrksld;": "⦏", "&lbrkslu;": "⦍", "&lcaron;": "ľ", "&lcedil;": "ļ", "&lceil;": "⌈", "&lcub;": "{", "&lcy;": "л", "&ldca;": "⤶", "&ldquo;": "“", "&ldquor;": "„", "&ldrdhar;": "⥧", "&ldrushar;": "⥋", "&ldsh;": "↲", "&le;": "≤", "&leftarrow;": "←", "&leftarrowtail;": "↢", "&leftharpoondown;": "↽", "&leftharpoonup;": "↼", "&leftleftarrows;": "⇇", "&leftrightarrow;": "↔", "&leftrightarrows;": "⇆", "&leftrightharpoons;": "⇋", "&leftrightsquigarrow;": "↭", "&leftthreetimes;": "⋋", "&leg;": "⋚", "&leq;": "≤", "&leqq;": "≦", "&leqslant;": "⩽", "&les;": "⩽", "&lescc;": "⪨", "&lesdot;": "⩿", "&lesdoto;": "⪁", "&lesdotor;": "⪃", "&lesg;": "⋚︀", "&lesges;": "⪓", "&lessapprox;": "⪅", "&lessdot;": "⋖", "&lesseqgtr;": "⋚", "&lesseqqgtr;": "⪋", "&lessgtr;": "≶", "&lesssim;": "≲", "&lfisht;": "⥼", "&lfloor;": "⌊", "&lfr;": "𝔩", "&lg;": "≶", "&lgE;": "⪑", "&lhard;": "↽", "&lharu;": "↼", "&lharul;": "⥪", "&lhblk;": "▄", "&ljcy;": "љ", "&ll;": "≪", "&llarr;": "⇇", "&llcorner;": "⌞", "&llhard;": "⥫", "&lltri;": "◺", "&lmidot;": "ŀ", "&lmoust;": "⎰", "&lmoustache;": "⎰", "&lnE;": "≨", "&lnap;": "⪉", "&lnapprox;": "⪉", "&lne;": "⪇", "&lneq;": "⪇", "&lneqq;": "≨", "&lnsim;": "⋦", "&loang;": "⟬", "&loarr;": "⇽", "&lobrk;": "⟦", "&longleftarrow;": "⟵", "&longleftrightarrow;": "⟷", "&longmapsto;": "⟼", "&longrightarrow;": "⟶", "&looparrowleft;": "↫", "&looparrowright;": "↬", "&lopar;": "⦅", "&lopf;": "𝕝", "&loplus;": "⨭", "&lotimes;": "⨴", "&lowast;": "∗", "&lowbar;": "_", "&loz;": "◊", "&lozenge;": "◊", "&lozf;": "⧫", "&lpar;": "(", "&lparlt;": "⦓", "&lrarr;": "⇆", "&lrcorner;": "⌟", "&lrhar;": "⇋", "&lrhard;": "⥭", "&lrm;": "‎", "&lrtri;": "⊿", "&lsaquo;": "‹", "&lscr;": "𝓁", "&lsh;": "↰", "&lsim;": "≲", "&lsime;": "⪍", "&lsimg;": "⪏", "&lsqb;": "[", "&lsquo;": "‘", "&lsquor;": "‚", "&lstrok;": "ł", "&lt": "<", "&lt;": "<", "&ltcc;": "⪦", "&ltcir;": "⩹", "&ltdot;": "⋖", "&lthree;": "⋋", "&ltimes;": "⋉", "&ltlarr;": "⥶", "&ltquest;": "⩻", "&ltrPar;": "⦖", "&ltri;": "◃", "&ltrie;": "⊴", "&ltrif;": "◂", "&lurdshar;": "⥊", "&luruhar;": "⥦", "&lvertneqq;": "≨︀", "&lvnE;": "≨︀", "&mDDot;": "∺", "&macr": "¯", "&macr;": "¯", "&male;": "♂", "&malt;": "✠", "&maltese;": "✠", "&map;": "↦", "&mapsto;": "↦", "&mapstodown;": "↧", "&mapstoleft;": "↤", "&mapstoup;": "↥", "&marker;": "▮", "&mcomma;": "⨩", "&mcy;": "м", "&mdash;": "—", "&measuredangle;": "∡", "&mfr;": "𝔪", "&mho;": "℧", "&micro": "µ", "&micro;": "µ", "&mid;": "∣", "&midast;": "*", "&midcir;": "⫰", "&middot": "·", "&middot;": "·", "&minus;": "−", "&minusb;": "⊟", "&minusd;": "∸", "&minusdu;": "⨪", "&mlcp;": "⫛", "&mldr;": "…", "&mnplus;": "∓", "&models;": "⊧", "&mopf;": "𝕞", "&mp;": "∓", "&mscr;": "𝓂", "&mstpos;": "∾", "&mu;": "μ", "&multimap;": "⊸", "&mumap;": "⊸", "&nGg;": "⋙̸", "&nGt;": "≫⃒", "&nGtv;": "≫̸", "&nLeftarrow;": "⇍", "&nLeftrightarrow;": "⇎", "&nLl;": "⋘̸", "&nLt;": "≪⃒", "&nLtv;": "≪̸", "&nRightarrow;": "⇏", "&nVDash;": "⊯", "&nVdash;": "⊮", "&nabla;": "∇", "&nacute;": "ń", "&nang;": "∠⃒", "&nap;": "≉", "&napE;": "⩰̸", "&napid;": "≋̸", "&napos;": "ŉ", "&napprox;": "≉", "&natur;": "♮", "&natural;": "♮", "&naturals;": "ℕ", "&nbsp": " ", "&nbsp;": " ", "&nbump;": "≎̸", "&nbumpe;": "≏̸", "&ncap;": "⩃", "&ncaron;": "ň", "&ncedil;": "ņ", "&ncong;": "≇", "&ncongdot;": "⩭̸", "&ncup;": "⩂", "&ncy;": "н", "&ndash;": "–", "&ne;": "≠", "&neArr;": "⇗", "&nearhk;": "⤤", "&nearr;": "↗", "&nearrow;": "↗", "&nedot;": "≐̸", "&nequiv;": "≢", "&nesear;": "⤨", "&nesim;": "≂̸", "&nexist;": "∄", "&nexists;": "∄", "&nfr;": "𝔫", "&ngE;": "≧̸", "&nge;": "≱", "&ngeq;": "≱", "&ngeqq;": "≧̸", "&ngeqslant;": "⩾̸", "&nges;": "⩾̸", "&ngsim;": "≵", "&ngt;": "≯", "&ngtr;": "≯", "&nhArr;": "⇎", "&nharr;": "↮", "&nhpar;": "⫲", "&ni;": "∋", "&nis;": "⋼", "&nisd;": "⋺", "&niv;": "∋", "&njcy;": "њ", "&nlArr;": "⇍", "&nlE;": "≦̸", "&nlarr;": "↚", "&nldr;": "‥", "&nle;": "≰", "&nleftarrow;": "↚", "&nleftrightarrow;": "↮", "&nleq;": "≰", "&nleqq;": "≦̸", "&nleqslant;": "⩽̸", "&nles;": "⩽̸", "&nless;": "≮", "&nlsim;": "≴", "&nlt;": "≮", "&nltri;": "⋪", "&nltrie;": "⋬", "&nmid;": "∤", "&nopf;": "𝕟", "&not": "¬", "&not;": "¬", "&notin;": "∉", "&notinE;": "⋹̸", "&notindot;": "⋵̸", "&notinva;": "∉", "&notinvb;": "⋷", "&notinvc;": "⋶", "&notni;": "∌", "&notniva;": "∌", "&notnivb;": "⋾", "&notnivc;": "⋽", "&npar;": "∦", "&nparallel;": "∦", "&nparsl;": "⫽⃥", "&npart;": "∂̸", "&npolint;": "⨔", "&npr;": "⊀", "&nprcue;": "⋠", "&npre;": "⪯̸", "&nprec;": "⊀", "&npreceq;": "⪯̸", "&nrArr;": "⇏", "&nrarr;": "↛", "&nrarrc;": "⤳̸", "&nrarrw;": "↝̸", "&nrightarrow;": "↛", "&nrtri;": "⋫", "&nrtrie;": "⋭", "&nsc;": "⊁", "&nsccue;": "⋡", "&nsce;": "⪰̸", "&nscr;": "𝓃", "&nshortmid;": "∤", "&nshortparallel;": "∦", "&nsim;": "≁", "&nsime;": "≄", "&nsimeq;": "≄", "&nsmid;": "∤", "&nspar;": "∦", "&nsqsube;": "⋢", "&nsqsupe;": "⋣", "&nsub;": "⊄", "&nsubE;": "⫅̸", "&nsube;": "⊈", "&nsubset;": "⊂⃒", "&nsubseteq;": "⊈", "&nsubseteqq;": "⫅̸", "&nsucc;": "⊁", "&nsucceq;": "⪰̸", "&nsup;": "⊅", "&nsupE;": "⫆̸", "&nsupe;": "⊉", "&nsupset;": "⊃⃒", "&nsupseteq;": "⊉", "&nsupseteqq;": "⫆̸", "&ntgl;": "≹", "&ntilde": "ñ", "&ntilde;": "ñ", "&ntlg;": "≸", "&ntriangleleft;": "⋪", "&ntrianglelefteq;": "⋬", "&ntriangleright;": "⋫", "&ntrianglerighteq;": "⋭", "&nu;": "ν", "&num;": "#", "&numero;": "№", "&numsp;": " ", "&nvDash;": "⊭", "&nvHarr;": "⤄", "&nvap;": "≍⃒", "&nvdash;": "⊬", "&nvge;": "≥⃒", "&nvgt;": ">⃒", "&nvinfin;": "⧞", "&nvlArr;": "⤂", "&nvle;": "≤⃒", "&nvlt;": "<⃒", "&nvltrie;": "⊴⃒", "&nvrArr;": "⤃", "&nvrtrie;": "⊵⃒", "&nvsim;": "∼⃒", "&nwArr;": "⇖", "&nwarhk;": "⤣", "&nwarr;": "↖", "&nwarrow;": "↖", "&nwnear;": "⤧", "&oS;": "Ⓢ", "&oacute": "ó", "&oacute;": "ó", "&oast;": "⊛", "&ocir;": "⊚", "&ocirc": "ô", "&ocirc;": "ô", "&ocy;": "о", "&odash;": "⊝", "&odblac;": "ő", "&odiv;": "⨸", "&odot;": "⊙", "&odsold;": "⦼", "&oelig;": "œ", "&ofcir;": "⦿", "&ofr;": "𝔬", "&ogon;": "˛", "&ograve": "ò", "&ograve;": "ò", "&ogt;": "⧁", "&ohbar;": "⦵", "&ohm;": "Ω", "&oint;": "∮", "&olarr;": "↺", "&olcir;": "⦾", "&olcross;": "⦻", "&oline;": "‾", "&olt;": "⧀", "&omacr;": "ō", "&omega;": "ω", "&omicron;": "ο", "&omid;": "⦶", "&ominus;": "⊖", "&oopf;": "𝕠", "&opar;": "⦷", "&operp;": "⦹", "&oplus;": "⊕", "&or;": "∨", "&orarr;": "↻", "&ord;": "⩝", "&order;": "ℴ", "&orderof;": "ℴ", "&ordf": "ª", "&ordf;": "ª", "&ordm": "º", "&ordm;": "º", "&origof;": "⊶", "&oror;": "⩖", "&orslope;": "⩗", "&orv;": "⩛", "&oscr;": "ℴ", "&oslash": "ø", "&oslash;": "ø", "&osol;": "⊘", "&otilde": "õ", "&otilde;": "õ", "&otimes;": "⊗", "&otimesas;": "⨶", "&ouml": "ö", "&ouml;": "ö", "&ovbar;": "⌽", "&par;": "∥", "&para": "¶", "&para;": "¶", "&parallel;": "∥", "&parsim;": "⫳", "&parsl;": "⫽", "&part;": "∂", "&pcy;": "п", "&percnt;": "%", "&period;": ".", "&permil;": "‰", "&perp;": "⊥", "&pertenk;": "‱", "&pfr;": "𝔭", "&phi;": "φ", "&phiv;": "ϕ", "&phmmat;": "ℳ", "&phone;": "☎", "&pi;": "π", "&pitchfork;": "⋔", "&piv;": "ϖ", "&planck;": "ℏ", "&planckh;": "ℎ", "&plankv;": "ℏ", "&plus;": "+", "&plusacir;": "⨣", "&plusb;": "⊞", "&pluscir;": "⨢", "&plusdo;": "∔", "&plusdu;": "⨥", "&pluse;": "⩲", "&plusmn": "±", "&plusmn;": "±", "&plussim;": "⨦", "&plustwo;": "⨧", "&pm;": "±", "&pointint;": "⨕", "&popf;": "𝕡", "&pound": "£", "&pound;": "£", "&pr;": "≺", "&prE;": "⪳", "&prap;": "⪷", "&prcue;": "≼", "&pre;": "⪯", "&prec;": "≺", "&precapprox;": "⪷", "&preccurlyeq;": "≼", "&preceq;": "⪯", "&precnapprox;": "⪹", "&precneqq;": "⪵", "&precnsim;": "⋨", "&precsim;": "≾", "&prime;": "′", "&primes;": "ℙ", "&prnE;": "⪵", "&prnap;": "⪹", "&prnsim;": "⋨", "&prod;": "∏", "&profalar;": "⌮", "&profline;": "⌒", "&profsurf;": "⌓", "&prop;": "∝", "&propto;": "∝", "&prsim;": "≾", "&prurel;": "⊰", "&pscr;": "𝓅", "&psi;": "ψ", "&puncsp;": " ", "&qfr;": "𝔮", "&qint;": "⨌", "&qopf;": "𝕢", "&qprime;": "⁗", "&qscr;": "𝓆", "&quaternions;": "ℍ", "&quatint;": "⨖", "&quest;": "?", "&questeq;": "≟", "&quot": '"', "&quot;": '"', "&rAarr;": "⇛", "&rArr;": "⇒", "&rAtail;": "⤜", "&rBarr;": "⤏", "&rHar;": "⥤", "&race;": "∽̱", "&racute;": "ŕ", "&radic;": "√", "&raemptyv;": "⦳", "&rang;": "⟩", "&rangd;": "⦒", "&range;": "⦥", "&rangle;": "⟩", "&raquo": "»", "&raquo;": "»", "&rarr;": "→", "&rarrap;": "⥵", "&rarrb;": "⇥", "&rarrbfs;": "⤠", "&rarrc;": "⤳", "&rarrfs;": "⤞", "&rarrhk;": "↪", "&rarrlp;": "↬", "&rarrpl;": "⥅", "&rarrsim;": "⥴", "&rarrtl;": "↣", "&rarrw;": "↝", "&ratail;": "⤚", "&ratio;": "∶", "&rationals;": "ℚ", "&rbarr;": "⤍", "&rbbrk;": "❳", "&rbrace;": "}", "&rbrack;": "]", "&rbrke;": "⦌", "&rbrksld;": "⦎", "&rbrkslu;": "⦐", "&rcaron;": "ř", "&rcedil;": "ŗ", "&rceil;": "⌉", "&rcub;": "}", "&rcy;": "р", "&rdca;": "⤷", "&rdldhar;": "⥩", "&rdquo;": "”", "&rdquor;": "”", "&rdsh;": "↳", "&real;": "ℜ", "&realine;": "ℛ", "&realpart;": "ℜ", "&reals;": "ℝ", "&rect;": "▭", "&reg": "®", "&reg;": "®", "&rfisht;": "⥽", "&rfloor;": "⌋", "&rfr;": "𝔯", "&rhard;": "⇁", "&rharu;": "⇀", "&rharul;": "⥬", "&rho;": "ρ", "&rhov;": "ϱ", "&rightarrow;": "→", "&rightarrowtail;": "↣", "&rightharpoondown;": "⇁", "&rightharpoonup;": "⇀", "&rightleftarrows;": "⇄", "&rightleftharpoons;": "⇌", "&rightrightarrows;": "⇉", "&rightsquigarrow;": "↝", "&rightthreetimes;": "⋌", "&ring;": "˚", "&risingdotseq;": "≓", "&rlarr;": "⇄", "&rlhar;": "⇌", "&rlm;": "‏", "&rmoust;": "⎱", "&rmoustache;": "⎱", "&rnmid;": "⫮", "&roang;": "⟭", "&roarr;": "⇾", "&robrk;": "⟧", "&ropar;": "⦆", "&ropf;": "𝕣", "&roplus;": "⨮", "&rotimes;": "⨵", "&rpar;": ")", "&rpargt;": "⦔", "&rppolint;": "⨒", "&rrarr;": "⇉", "&rsaquo;": "›", "&rscr;": "𝓇", "&rsh;": "↱", "&rsqb;": "]", "&rsquo;": "’", "&rsquor;": "’", "&rthree;": "⋌", "&rtimes;": "⋊", "&rtri;": "▹", "&rtrie;": "⊵", "&rtrif;": "▸", "&rtriltri;": "⧎", "&ruluhar;": "⥨", "&rx;": "℞", "&sacute;": "ś", "&sbquo;": "‚", "&sc;": "≻", "&scE;": "⪴", "&scap;": "⪸", "&scaron;": "š", "&sccue;": "≽", "&sce;": "⪰", "&scedil;": "ş", "&scirc;": "ŝ", "&scnE;": "⪶", "&scnap;": "⪺", "&scnsim;": "⋩", "&scpolint;": "⨓", "&scsim;": "≿", "&scy;": "с", "&sdot;": "⋅", "&sdotb;": "⊡", "&sdote;": "⩦", "&seArr;": "⇘", "&searhk;": "⤥", "&searr;": "↘", "&searrow;": "↘", "&sect": "§", "&sect;": "§", "&semi;": ";", "&seswar;": "⤩", "&setminus;": "∖", "&setmn;": "∖", "&sext;": "✶", "&sfr;": "𝔰", "&sfrown;": "⌢", "&sharp;": "♯", "&shchcy;": "щ", "&shcy;": "ш", "&shortmid;": "∣", "&shortparallel;": "∥", "&shy": "­", "&shy;": "­", "&sigma;": "σ", "&sigmaf;": "ς", "&sigmav;": "ς", "&sim;": "∼", "&simdot;": "⩪", "&sime;": "≃", "&simeq;": "≃", "&simg;": "⪞", "&simgE;": "⪠", "&siml;": "⪝", "&simlE;": "⪟", "&simne;": "≆", "&simplus;": "⨤", "&simrarr;": "⥲", "&slarr;": "←", "&smallsetminus;": "∖", "&smashp;": "⨳", "&smeparsl;": "⧤", "&smid;": "∣", "&smile;": "⌣", "&smt;": "⪪", "&smte;": "⪬", "&smtes;": "⪬︀", "&softcy;": "ь", "&sol;": "/", "&solb;": "⧄", "&solbar;": "⌿", "&sopf;": "𝕤", "&spades;": "♠", "&spadesuit;": "♠", "&spar;": "∥", "&sqcap;": "⊓", "&sqcaps;": "⊓︀", "&sqcup;": "⊔", "&sqcups;": "⊔︀", "&sqsub;": "⊏", "&sqsube;": "⊑", "&sqsubset;": "⊏", "&sqsubseteq;": "⊑", "&sqsup;": "⊐", "&sqsupe;": "⊒", "&sqsupset;": "⊐", "&sqsupseteq;": "⊒", "&squ;": "□", "&square;": "□", "&squarf;": "▪", "&squf;": "▪", "&srarr;": "→", "&sscr;": "𝓈", "&ssetmn;": "∖", "&ssmile;": "⌣", "&sstarf;": "⋆", "&star;": "☆", "&starf;": "★", "&straightepsilon;": "ϵ", "&straightphi;": "ϕ", "&strns;": "¯", "&sub;": "⊂", "&subE;": "⫅", "&subdot;": "⪽", "&sube;": "⊆", "&subedot;": "⫃", "&submult;": "⫁", "&subnE;": "⫋", "&subne;": "⊊", "&subplus;": "⪿", "&subrarr;": "⥹", "&subset;": "⊂", "&subseteq;": "⊆", "&subseteqq;": "⫅", "&subsetneq;": "⊊", "&subsetneqq;": "⫋", "&subsim;": "⫇", "&subsub;": "⫕", "&subsup;": "⫓", "&succ;": "≻", "&succapprox;": "⪸", "&succcurlyeq;": "≽", "&succeq;": "⪰", "&succnapprox;": "⪺", "&succneqq;": "⪶", "&succnsim;": "⋩", "&succsim;": "≿", "&sum;": "∑", "&sung;": "♪", "&sup1": "¹", "&sup1;": "¹", "&sup2": "²", "&sup2;": "²", "&sup3": "³", "&sup3;": "³", "&sup;": "⊃", "&supE;": "⫆", "&supdot;": "⪾", "&supdsub;": "⫘", "&supe;": "⊇", "&supedot;": "⫄", "&suphsol;": "⟉", "&suphsub;": "⫗", "&suplarr;": "⥻", "&supmult;": "⫂", "&supnE;": "⫌", "&supne;": "⊋", "&supplus;": "⫀", "&supset;": "⊃", "&supseteq;": "⊇", "&supseteqq;": "⫆", "&supsetneq;": "⊋", "&supsetneqq;": "⫌", "&supsim;": "⫈", "&supsub;": "⫔", "&supsup;": "⫖", "&swArr;": "⇙", "&swarhk;": "⤦", "&swarr;": "↙", "&swarrow;": "↙", "&swnwar;": "⤪", "&szlig": "ß", "&szlig;": "ß", "&target;": "⌖", "&tau;": "τ", "&tbrk;": "⎴", "&tcaron;": "ť", "&tcedil;": "ţ", "&tcy;": "т", "&tdot;": "⃛", "&telrec;": "⌕", "&tfr;": "𝔱", "&there4;": "∴", "&therefore;": "∴", "&theta;": "θ", "&thetasym;": "ϑ", "&thetav;": "ϑ", "&thickapprox;": "≈", "&thicksim;": "∼", "&thinsp;": " ", "&thkap;": "≈", "&thksim;": "∼", "&thorn": "þ", "&thorn;": "þ", "&tilde;": "˜", "&times": "×", "&times;": "×", "&timesb;": "⊠", "&timesbar;": "⨱", "&timesd;": "⨰", "&tint;": "∭", "&toea;": "⤨", "&top;": "⊤", "&topbot;": "⌶", "&topcir;": "⫱", "&topf;": "𝕥", "&topfork;": "⫚", "&tosa;": "⤩", "&tprime;": "‴", "&trade;": "™", "&triangle;": "▵", "&triangledown;": "▿", "&triangleleft;": "◃", "&trianglelefteq;": "⊴", "&triangleq;": "≜", "&triangleright;": "▹", "&trianglerighteq;": "⊵", "&tridot;": "◬", "&trie;": "≜", "&triminus;": "⨺", "&triplus;": "⨹", "&trisb;": "⧍", "&tritime;": "⨻", "&trpezium;": "⏢", "&tscr;": "𝓉", "&tscy;": "ц", "&tshcy;": "ћ", "&tstrok;": "ŧ", "&twixt;": "≬", "&twoheadleftarrow;": "↞", "&twoheadrightarrow;": "↠", "&uArr;": "⇑", "&uHar;": "⥣", "&uacute": "ú", "&uacute;": "ú", "&uarr;": "↑", "&ubrcy;": "ў", "&ubreve;": "ŭ", "&ucirc": "û", "&ucirc;": "û", "&ucy;": "у", "&udarr;": "⇅", "&udblac;": "ű", "&udhar;": "⥮", "&ufisht;": "⥾", "&ufr;": "𝔲", "&ugrave": "ù", "&ugrave;": "ù", "&uharl;": "↿", "&uharr;": "↾", "&uhblk;": "▀", "&ulcorn;": "⌜", "&ulcorner;": "⌜", "&ulcrop;": "⌏", "&ultri;": "◸", "&umacr;": "ū", "&uml": "¨", "&uml;": "¨", "&uogon;": "ų", "&uopf;": "𝕦", "&uparrow;": "↑", "&updownarrow;": "↕", "&upharpoonleft;": "↿", "&upharpoonright;": "↾", "&uplus;": "⊎", "&upsi;": "υ", "&upsih;": "ϒ", "&upsilon;": "υ", "&upuparrows;": "⇈", "&urcorn;": "⌝", "&urcorner;": "⌝", "&urcrop;": "⌎", "&uring;": "ů", "&urtri;": "◹", "&uscr;": "𝓊", "&utdot;": "⋰", "&utilde;": "ũ", "&utri;": "▵", "&utrif;": "▴", "&uuarr;": "⇈", "&uuml": "ü", "&uuml;": "ü", "&uwangle;": "⦧", "&vArr;": "⇕", "&vBar;": "⫨", "&vBarv;": "⫩", "&vDash;": "⊨", "&vangrt;": "⦜", "&varepsilon;": "ϵ", "&varkappa;": "ϰ", "&varnothing;": "∅", "&varphi;": "ϕ", "&varpi;": "ϖ", "&varpropto;": "∝", "&varr;": "↕", "&varrho;": "ϱ", "&varsigma;": "ς", "&varsubsetneq;": "⊊︀", "&varsubsetneqq;": "⫋︀", "&varsupsetneq;": "⊋︀", "&varsupsetneqq;": "⫌︀", "&vartheta;": "ϑ", "&vartriangleleft;": "⊲", "&vartriangleright;": "⊳", "&vcy;": "в", "&vdash;": "⊢", "&vee;": "∨", "&veebar;": "⊻", "&veeeq;": "≚", "&vellip;": "⋮", "&verbar;": "|", "&vert;": "|", "&vfr;": "𝔳", "&vltri;": "⊲", "&vnsub;": "⊂⃒", "&vnsup;": "⊃⃒", "&vopf;": "𝕧", "&vprop;": "∝", "&vrtri;": "⊳", "&vscr;": "𝓋", "&vsubnE;": "⫋︀", "&vsubne;": "⊊︀", "&vsupnE;": "⫌︀", "&vsupne;": "⊋︀", "&vzigzag;": "⦚", "&wcirc;": "ŵ", "&wedbar;": "⩟", "&wedge;": "∧", "&wedgeq;": "≙", "&weierp;": "℘", "&wfr;": "𝔴", "&wopf;": "𝕨", "&wp;": "℘", "&wr;": "≀", "&wreath;": "≀", "&wscr;": "𝓌", "&xcap;": "⋂", "&xcirc;": "◯", "&xcup;": "⋃", "&xdtri;": "▽", "&xfr;": "𝔵", "&xhArr;": "⟺", "&xharr;": "⟷", "&xi;": "ξ", "&xlArr;": "⟸", "&xlarr;": "⟵", "&xmap;": "⟼", "&xnis;": "⋻", "&xodot;": "⨀", "&xopf;": "𝕩", "&xoplus;": "⨁", "&xotime;": "⨂", "&xrArr;": "⟹", "&xrarr;": "⟶", "&xscr;": "𝓍", "&xsqcup;": "⨆", "&xuplus;": "⨄", "&xutri;": "△", "&xvee;": "⋁", "&xwedge;": "⋀", "&yacute": "ý", "&yacute;": "ý", "&yacy;": "я", "&ycirc;": "ŷ", "&ycy;": "ы", "&yen": "¥", "&yen;": "¥", "&yfr;": "𝔶", "&yicy;": "ї", "&yopf;": "𝕪", "&yscr;": "𝓎", "&yucy;": "ю", "&yuml": "ÿ", "&yuml;": "ÿ", "&zacute;": "ź", "&zcaron;": "ž", "&zcy;": "з", "&zdot;": "ż", "&zeetrf;": "ℨ", "&zeta;": "ζ", "&zfr;": "𝔷", "&zhcy;": "ж", "&zigrarr;": "⇝", "&zopf;": "𝕫", "&zscr;": "𝓏", "&zwj;": "‍", "&zwnj;": "‌" }, characters: { "Æ": "&AElig;", "&": "&amp;", "Á": "&Aacute;", "Ă": "&Abreve;", "Â": "&Acirc;", "А": "&Acy;", "𝔄": "&Afr;", "À": "&Agrave;", "Α": "&Alpha;", "Ā": "&Amacr;", "⩓": "&And;", "Ą": "&Aogon;", "𝔸": "&Aopf;", "⁡": "&af;", "Å": "&angst;", "𝒜": "&Ascr;", "≔": "&coloneq;", "Ã": "&Atilde;", "Ä": "&Auml;", "∖": "&ssetmn;", "⫧": "&Barv;", "⌆": "&doublebarwedge;", "Б": "&Bcy;", "∵": "&because;", "ℬ": "&bernou;", "Β": "&Beta;", "𝔅": "&Bfr;", "𝔹": "&Bopf;", "˘": "&breve;", "≎": "&bump;", "Ч": "&CHcy;", "©": "&copy;", "Ć": "&Cacute;", "⋒": "&Cap;", "ⅅ": "&DD;", "ℭ": "&Cfr;", "Č": "&Ccaron;", "Ç": "&Ccedil;", "Ĉ": "&Ccirc;", "∰": "&Cconint;", "Ċ": "&Cdot;", "¸": "&cedil;", "·": "&middot;", "Χ": "&Chi;", "⊙": "&odot;", "⊖": "&ominus;", "⊕": "&oplus;", "⊗": "&otimes;", "∲": "&cwconint;", "”": "&rdquor;", "’": "&rsquor;", "∷": "&Proportion;", "⩴": "&Colone;", "≡": "&equiv;", "∯": "&DoubleContourIntegral;", "∮": "&oint;", "ℂ": "&complexes;", "∐": "&coprod;", "∳": "&awconint;", "⨯": "&Cross;", "𝒞": "&Cscr;", "⋓": "&Cup;", "≍": "&asympeq;", "⤑": "&DDotrahd;", "Ђ": "&DJcy;", "Ѕ": "&DScy;", "Џ": "&DZcy;", "‡": "&ddagger;", "↡": "&Darr;", "⫤": "&DoubleLeftTee;", "Ď": "&Dcaron;", "Д": "&Dcy;", "∇": "&nabla;", "Δ": "&Delta;", "𝔇": "&Dfr;", "´": "&acute;", "˙": "&dot;", "˝": "&dblac;", "`": "&grave;", "˜": "&tilde;", "⋄": "&diamond;", "ⅆ": "&dd;", "𝔻": "&Dopf;", "¨": "&uml;", "⃜": "&DotDot;", "≐": "&esdot;", "⇓": "&dArr;", "⇐": "&lArr;", "⇔": "&iff;", "⟸": "&xlArr;", "⟺": "&xhArr;", "⟹": "&xrArr;", "⇒": "&rArr;", "⊨": "&vDash;", "⇑": "&uArr;", "⇕": "&vArr;", "∥": "&spar;", "↓": "&downarrow;", "⤓": "&DownArrowBar;", "⇵": "&duarr;", "̑": "&DownBreve;", "⥐": "&DownLeftRightVector;", "⥞": "&DownLeftTeeVector;", "↽": "&lhard;", "⥖": "&DownLeftVectorBar;", "⥟": "&DownRightTeeVector;", "⇁": "&rightharpoondown;", "⥗": "&DownRightVectorBar;", "⊤": "&top;", "↧": "&mapstodown;", "𝒟": "&Dscr;", "Đ": "&Dstrok;", "Ŋ": "&ENG;", "Ð": "&ETH;", "É": "&Eacute;", "Ě": "&Ecaron;", "Ê": "&Ecirc;", "Э": "&Ecy;", "Ė": "&Edot;", "𝔈": "&Efr;", "È": "&Egrave;", "∈": "&isinv;", "Ē": "&Emacr;", "◻": "&EmptySmallSquare;", "▫": "&EmptyVerySmallSquare;", "Ę": "&Eogon;", "𝔼": "&Eopf;", "Ε": "&Epsilon;", "⩵": "&Equal;", "≂": "&esim;", "⇌": "&rlhar;", "ℰ": "&expectation;", "⩳": "&Esim;", "Η": "&Eta;", "Ë": "&Euml;", "∃": "&exist;", "ⅇ": "&exponentiale;", "Ф": "&Fcy;", "𝔉": "&Ffr;", "◼": "&FilledSmallSquare;", "▪": "&squf;", "𝔽": "&Fopf;", "∀": "&forall;", "ℱ": "&Fscr;", "Ѓ": "&GJcy;", ">": "&gt;", "Γ": "&Gamma;", "Ϝ": "&Gammad;", "Ğ": "&Gbreve;", "Ģ": "&Gcedil;", "Ĝ": "&Gcirc;", "Г": "&Gcy;", "Ġ": "&Gdot;", "𝔊": "&Gfr;", "⋙": "&ggg;", "𝔾": "&Gopf;", "≥": "&geq;", "⋛": "&gtreqless;", "≧": "&geqq;", "⪢": "&GreaterGreater;", "≷": "&gtrless;", "⩾": "&ges;", "≳": "&gtrsim;", "𝒢": "&Gscr;", "≫": "&gg;", "Ъ": "&HARDcy;", "ˇ": "&caron;", "^": "&Hat;", "Ĥ": "&Hcirc;", "ℌ": "&Poincareplane;", "ℋ": "&hamilt;", "ℍ": "&quaternions;", "─": "&boxh;", "Ħ": "&Hstrok;", "≏": "&bumpeq;", "Е": "&IEcy;", "Ĳ": "&IJlig;", "Ё": "&IOcy;", "Í": "&Iacute;", "Î": "&Icirc;", "И": "&Icy;", "İ": "&Idot;", "ℑ": "&imagpart;", "Ì": "&Igrave;", "Ī": "&Imacr;", "ⅈ": "&ii;", "∬": "&Int;", "∫": "&int;", "⋂": "&xcap;", "⁣": "&ic;", "⁢": "&it;", "Į": "&Iogon;", "𝕀": "&Iopf;", "Ι": "&Iota;", "ℐ": "&imagline;", "Ĩ": "&Itilde;", "І": "&Iukcy;", "Ï": "&Iuml;", "Ĵ": "&Jcirc;", "Й": "&Jcy;", "𝔍": "&Jfr;", "𝕁": "&Jopf;", "𝒥": "&Jscr;", "Ј": "&Jsercy;", "Є": "&Jukcy;", "Х": "&KHcy;", "Ќ": "&KJcy;", "Κ": "&Kappa;", "Ķ": "&Kcedil;", "К": "&Kcy;", "𝔎": "&Kfr;", "𝕂": "&Kopf;", "𝒦": "&Kscr;", "Љ": "&LJcy;", "<": "&lt;", "Ĺ": "&Lacute;", "Λ": "&Lambda;", "⟪": "&Lang;", "ℒ": "&lagran;", "↞": "&twoheadleftarrow;", "Ľ": "&Lcaron;", "Ļ": "&Lcedil;", "Л": "&Lcy;", "⟨": "&langle;", "←": "&slarr;", "⇤": "&larrb;", "⇆": "&lrarr;", "⌈": "&lceil;", "⟦": "&lobrk;", "⥡": "&LeftDownTeeVector;", "⇃": "&downharpoonleft;", "⥙": "&LeftDownVectorBar;", "⌊": "&lfloor;", "↔": "&leftrightarrow;", "⥎": "&LeftRightVector;", "⊣": "&dashv;", "↤": "&mapstoleft;", "⥚": "&LeftTeeVector;", "⊲": "&vltri;", "⧏": "&LeftTriangleBar;", "⊴": "&trianglelefteq;", "⥑": "&LeftUpDownVector;", "⥠": "&LeftUpTeeVector;", "↿": "&upharpoonleft;", "⥘": "&LeftUpVectorBar;", "↼": "&lharu;", "⥒": "&LeftVectorBar;", "⋚": "&lesseqgtr;", "≦": "&leqq;", "≶": "&lg;", "⪡": "&LessLess;", "⩽": "&les;", "≲": "&lsim;", "𝔏": "&Lfr;", "⋘": "&Ll;", "⇚": "&lAarr;", "Ŀ": "&Lmidot;", "⟵": "&xlarr;", "⟷": "&xharr;", "⟶": "&xrarr;", "𝕃": "&Lopf;", "↙": "&swarrow;", "↘": "&searrow;", "↰": "&lsh;", "Ł": "&Lstrok;", "≪": "&ll;", "⤅": "&Map;", "М": "&Mcy;", " ": "&MediumSpace;", "ℳ": "&phmmat;", "𝔐": "&Mfr;", "∓": "&mp;", "𝕄": "&Mopf;", "Μ": "&Mu;", "Њ": "&NJcy;", "Ń": "&Nacute;", "Ň": "&Ncaron;", "Ņ": "&Ncedil;", "Н": "&Ncy;", "​": "&ZeroWidthSpace;", "\n": "&NewLine;", "𝔑": "&Nfr;", "⁠": "&NoBreak;", " ": "&nbsp;", "ℕ": "&naturals;", "⫬": "&Not;", "≢": "&nequiv;", "≭": "&NotCupCap;", "∦": "&nspar;", "∉": "&notinva;", "≠": "&ne;", "≂̸": "&nesim;", "∄": "&nexists;", "≯": "&ngtr;", "≱": "&ngeq;", "≧̸": "&ngeqq;", "≫̸": "&nGtv;", "≹": "&ntgl;", "⩾̸": "&nges;", "≵": "&ngsim;", "≎̸": "&nbump;", "≏̸": "&nbumpe;", "⋪": "&ntriangleleft;", "⧏̸": "&NotLeftTriangleBar;", "⋬": "&ntrianglelefteq;", "≮": "&nlt;", "≰": "&nleq;", "≸": "&ntlg;", "≪̸": "&nLtv;", "⩽̸": "&nles;", "≴": "&nlsim;", "⪢̸": "&NotNestedGreaterGreater;", "⪡̸": "&NotNestedLessLess;", "⊀": "&nprec;", "⪯̸": "&npreceq;", "⋠": "&nprcue;", "∌": "&notniva;", "⋫": "&ntriangleright;", "⧐̸": "&NotRightTriangleBar;", "⋭": "&ntrianglerighteq;", "⊏̸": "&NotSquareSubset;", "⋢": "&nsqsube;", "⊐̸": "&NotSquareSuperset;", "⋣": "&nsqsupe;", "⊂⃒": "&vnsub;", "⊈": "&nsubseteq;", "⊁": "&nsucc;", "⪰̸": "&nsucceq;", "⋡": "&nsccue;", "≿̸": "&NotSucceedsTilde;", "⊃⃒": "&vnsup;", "⊉": "&nsupseteq;", "≁": "&nsim;", "≄": "&nsimeq;", "≇": "&ncong;", "≉": "&napprox;", "∤": "&nsmid;", "𝒩": "&Nscr;", "Ñ": "&Ntilde;", "Ν": "&Nu;", "Œ": "&OElig;", "Ó": "&Oacute;", "Ô": "&Ocirc;", "О": "&Ocy;", "Ő": "&Odblac;", "𝔒": "&Ofr;", "Ò": "&Ograve;", "Ō": "&Omacr;", "Ω": "&ohm;", "Ο": "&Omicron;", "𝕆": "&Oopf;", "“": "&ldquo;", "‘": "&lsquo;", "⩔": "&Or;", "𝒪": "&Oscr;", "Ø": "&Oslash;", "Õ": "&Otilde;", "⨷": "&Otimes;", "Ö": "&Ouml;", "‾": "&oline;", "⏞": "&OverBrace;", "⎴": "&tbrk;", "⏜": "&OverParenthesis;", "∂": "&part;", "П": "&Pcy;", "𝔓": "&Pfr;", "Φ": "&Phi;", "Π": "&Pi;", "±": "&pm;", "ℙ": "&primes;", "⪻": "&Pr;", "≺": "&prec;", "⪯": "&preceq;", "≼": "&preccurlyeq;", "≾": "&prsim;", "″": "&Prime;", "∏": "&prod;", "∝": "&vprop;", "𝒫": "&Pscr;", "Ψ": "&Psi;", '"': "&quot;", "𝔔": "&Qfr;", "ℚ": "&rationals;", "𝒬": "&Qscr;", "⤐": "&drbkarow;", "®": "&reg;", "Ŕ": "&Racute;", "⟫": "&Rang;", "↠": "&twoheadrightarrow;", "⤖": "&Rarrtl;", "Ř": "&Rcaron;", "Ŗ": "&Rcedil;", "Р": "&Rcy;", "ℜ": "&realpart;", "∋": "&niv;", "⇋": "&lrhar;", "⥯": "&duhar;", "Ρ": "&Rho;", "⟩": "&rangle;", "→": "&srarr;", "⇥": "&rarrb;", "⇄": "&rlarr;", "⌉": "&rceil;", "⟧": "&robrk;", "⥝": "&RightDownTeeVector;", "⇂": "&downharpoonright;", "⥕": "&RightDownVectorBar;", "⌋": "&rfloor;", "⊢": "&vdash;", "↦": "&mapsto;", "⥛": "&RightTeeVector;", "⊳": "&vrtri;", "⧐": "&RightTriangleBar;", "⊵": "&trianglerighteq;", "⥏": "&RightUpDownVector;", "⥜": "&RightUpTeeVector;", "↾": "&upharpoonright;", "⥔": "&RightUpVectorBar;", "⇀": "&rightharpoonup;", "⥓": "&RightVectorBar;", "ℝ": "&reals;", "⥰": "&RoundImplies;", "⇛": "&rAarr;", "ℛ": "&realine;", "↱": "&rsh;", "⧴": "&RuleDelayed;", "Щ": "&SHCHcy;", "Ш": "&SHcy;", "Ь": "&SOFTcy;", "Ś": "&Sacute;", "⪼": "&Sc;", "Š": "&Scaron;", "Ş": "&Scedil;", "Ŝ": "&Scirc;", "С": "&Scy;", "𝔖": "&Sfr;", "↑": "&uparrow;", "Σ": "&Sigma;", "∘": "&compfn;", "𝕊": "&Sopf;", "√": "&radic;", "□": "&square;", "⊓": "&sqcap;", "⊏": "&sqsubset;", "⊑": "&sqsubseteq;", "⊐": "&sqsupset;", "⊒": "&sqsupseteq;", "⊔": "&sqcup;", "𝒮": "&Sscr;", "⋆": "&sstarf;", "⋐": "&Subset;", "⊆": "&subseteq;", "≻": "&succ;", "⪰": "&succeq;", "≽": "&succcurlyeq;", "≿": "&succsim;", "∑": "&sum;", "⋑": "&Supset;", "⊃": "&supset;", "⊇": "&supseteq;", "Þ": "&THORN;", "™": "&trade;", "Ћ": "&TSHcy;", "Ц": "&TScy;", "	": "&Tab;", "Τ": "&Tau;", "Ť": "&Tcaron;", "Ţ": "&Tcedil;", "Т": "&Tcy;", "𝔗": "&Tfr;", "∴": "&therefore;", "Θ": "&Theta;", "  ": "&ThickSpace;", " ": "&thinsp;", "∼": "&thksim;", "≃": "&simeq;", "≅": "&cong;", "≈": "&thkap;", "𝕋": "&Topf;", "⃛": "&tdot;", "𝒯": "&Tscr;", "Ŧ": "&Tstrok;", "Ú": "&Uacute;", "↟": "&Uarr;", "⥉": "&Uarrocir;", "Ў": "&Ubrcy;", "Ŭ": "&Ubreve;", "Û": "&Ucirc;", "У": "&Ucy;", "Ű": "&Udblac;", "𝔘": "&Ufr;", "Ù": "&Ugrave;", "Ū": "&Umacr;", _: "&lowbar;", "⏟": "&UnderBrace;", "⎵": "&bbrk;", "⏝": "&UnderParenthesis;", "⋃": "&xcup;", "⊎": "&uplus;", "Ų": "&Uogon;", "𝕌": "&Uopf;", "⤒": "&UpArrowBar;", "⇅": "&udarr;", "↕": "&varr;", "⥮": "&udhar;", "⊥": "&perp;", "↥": "&mapstoup;", "↖": "&nwarrow;", "↗": "&nearrow;", "ϒ": "&upsih;", "Υ": "&Upsilon;", "Ů": "&Uring;", "𝒰": "&Uscr;", "Ũ": "&Utilde;", "Ü": "&Uuml;", "⊫": "&VDash;", "⫫": "&Vbar;", "В": "&Vcy;", "⊩": "&Vdash;", "⫦": "&Vdashl;", "⋁": "&xvee;", "‖": "&Vert;", "∣": "&smid;", "|": "&vert;", "❘": "&VerticalSeparator;", "≀": "&wreath;", " ": "&hairsp;", "𝔙": "&Vfr;", "𝕍": "&Vopf;", "𝒱": "&Vscr;", "⊪": "&Vvdash;", "Ŵ": "&Wcirc;", "⋀": "&xwedge;", "𝔚": "&Wfr;", "𝕎": "&Wopf;", "𝒲": "&Wscr;", "𝔛": "&Xfr;", "Ξ": "&Xi;", "𝕏": "&Xopf;", "𝒳": "&Xscr;", "Я": "&YAcy;", "Ї": "&YIcy;", "Ю": "&YUcy;", "Ý": "&Yacute;", "Ŷ": "&Ycirc;", "Ы": "&Ycy;", "𝔜": "&Yfr;", "𝕐": "&Yopf;", "𝒴": "&Yscr;", "Ÿ": "&Yuml;", "Ж": "&ZHcy;", "Ź": "&Zacute;", "Ž": "&Zcaron;", "З": "&Zcy;", "Ż": "&Zdot;", "Ζ": "&Zeta;", "ℨ": "&zeetrf;", "ℤ": "&integers;", "𝒵": "&Zscr;", "á": "&aacute;", "ă": "&abreve;", "∾": "&mstpos;", "∾̳": "&acE;", "∿": "&acd;", "â": "&acirc;", "а": "&acy;", "æ": "&aelig;", "𝔞": "&afr;", "à": "&agrave;", "ℵ": "&aleph;", "α": "&alpha;", "ā": "&amacr;", "⨿": "&amalg;", "∧": "&wedge;", "⩕": "&andand;", "⩜": "&andd;", "⩘": "&andslope;", "⩚": "&andv;", "∠": "&angle;", "⦤": "&ange;", "∡": "&measuredangle;", "⦨": "&angmsdaa;", "⦩": "&angmsdab;", "⦪": "&angmsdac;", "⦫": "&angmsdad;", "⦬": "&angmsdae;", "⦭": "&angmsdaf;", "⦮": "&angmsdag;", "⦯": "&angmsdah;", "∟": "&angrt;", "⊾": "&angrtvb;", "⦝": "&angrtvbd;", "∢": "&angsph;", "⍼": "&angzarr;", "ą": "&aogon;", "𝕒": "&aopf;", "⩰": "&apE;", "⩯": "&apacir;", "≊": "&approxeq;", "≋": "&apid;", "'": "&apos;", "å": "&aring;", "𝒶": "&ascr;", "*": "&midast;", "ã": "&atilde;", "ä": "&auml;", "⨑": "&awint;", "⫭": "&bNot;", "≌": "&bcong;", "϶": "&bepsi;", "‵": "&bprime;", "∽": "&bsim;", "⋍": "&bsime;", "⊽": "&barvee;", "⌅": "&barwedge;", "⎶": "&bbrktbrk;", "б": "&bcy;", "„": "&ldquor;", "⦰": "&bemptyv;", "β": "&beta;", "ℶ": "&beth;", "≬": "&twixt;", "𝔟": "&bfr;", "◯": "&xcirc;", "⨀": "&xodot;", "⨁": "&xoplus;", "⨂": "&xotime;", "⨆": "&xsqcup;", "★": "&starf;", "▽": "&xdtri;", "△": "&xutri;", "⨄": "&xuplus;", "⤍": "&rbarr;", "⧫": "&lozf;", "▴": "&utrif;", "▾": "&dtrif;", "◂": "&ltrif;", "▸": "&rtrif;", "␣": "&blank;", "▒": "&blk12;", "░": "&blk14;", "▓": "&blk34;", "█": "&block;", "=⃥": "&bne;", "≡⃥": "&bnequiv;", "⌐": "&bnot;", "𝕓": "&bopf;", "⋈": "&bowtie;", "╗": "&boxDL;", "╔": "&boxDR;", "╖": "&boxDl;", "╓": "&boxDr;", "═": "&boxH;", "╦": "&boxHD;", "╩": "&boxHU;", "╤": "&boxHd;", "╧": "&boxHu;", "╝": "&boxUL;", "╚": "&boxUR;", "╜": "&boxUl;", "╙": "&boxUr;", "║": "&boxV;", "╬": "&boxVH;", "╣": "&boxVL;", "╠": "&boxVR;", "╫": "&boxVh;", "╢": "&boxVl;", "╟": "&boxVr;", "⧉": "&boxbox;", "╕": "&boxdL;", "╒": "&boxdR;", "┐": "&boxdl;", "┌": "&boxdr;", "╥": "&boxhD;", "╨": "&boxhU;", "┬": "&boxhd;", "┴": "&boxhu;", "⊟": "&minusb;", "⊞": "&plusb;", "⊠": "&timesb;", "╛": "&boxuL;", "╘": "&boxuR;", "┘": "&boxul;", "└": "&boxur;", "│": "&boxv;", "╪": "&boxvH;", "╡": "&boxvL;", "╞": "&boxvR;", "┼": "&boxvh;", "┤": "&boxvl;", "├": "&boxvr;", "¦": "&brvbar;", "𝒷": "&bscr;", "⁏": "&bsemi;", "\\": "&bsol;", "⧅": "&bsolb;", "⟈": "&bsolhsub;", "•": "&bullet;", "⪮": "&bumpE;", "ć": "&cacute;", "∩": "&cap;", "⩄": "&capand;", "⩉": "&capbrcup;", "⩋": "&capcap;", "⩇": "&capcup;", "⩀": "&capdot;", "∩︀": "&caps;", "⁁": "&caret;", "⩍": "&ccaps;", "č": "&ccaron;", "ç": "&ccedil;", "ĉ": "&ccirc;", "⩌": "&ccups;", "⩐": "&ccupssm;", "ċ": "&cdot;", "⦲": "&cemptyv;", "¢": "&cent;", "𝔠": "&cfr;", "ч": "&chcy;", "✓": "&checkmark;", "χ": "&chi;", "○": "&cir;", "⧃": "&cirE;", "ˆ": "&circ;", "≗": "&cire;", "↺": "&olarr;", "↻": "&orarr;", "Ⓢ": "&oS;", "⊛": "&oast;", "⊚": "&ocir;", "⊝": "&odash;", "⨐": "&cirfnint;", "⫯": "&cirmid;", "⧂": "&cirscir;", "♣": "&clubsuit;", ":": "&colon;", ",": "&comma;", "@": "&commat;", "∁": "&complement;", "⩭": "&congdot;", "𝕔": "&copf;", "℗": "&copysr;", "↵": "&crarr;", "✗": "&cross;", "𝒸": "&cscr;", "⫏": "&csub;", "⫑": "&csube;", "⫐": "&csup;", "⫒": "&csupe;", "⋯": "&ctdot;", "⤸": "&cudarrl;", "⤵": "&cudarrr;", "⋞": "&curlyeqprec;", "⋟": "&curlyeqsucc;", "↶": "&curvearrowleft;", "⤽": "&cularrp;", "∪": "&cup;", "⩈": "&cupbrcap;", "⩆": "&cupcap;", "⩊": "&cupcup;", "⊍": "&cupdot;", "⩅": "&cupor;", "∪︀": "&cups;", "↷": "&curvearrowright;", "⤼": "&curarrm;", "⋎": "&cuvee;", "⋏": "&cuwed;", "¤": "&curren;", "∱": "&cwint;", "⌭": "&cylcty;", "⥥": "&dHar;", "†": "&dagger;", "ℸ": "&daleth;", "‐": "&hyphen;", "⤏": "&rBarr;", "ď": "&dcaron;", "д": "&dcy;", "⇊": "&downdownarrows;", "⩷": "&eDDot;", "°": "&deg;", "δ": "&delta;", "⦱": "&demptyv;", "⥿": "&dfisht;", "𝔡": "&dfr;", "♦": "&diams;", "ϝ": "&gammad;", "⋲": "&disin;", "÷": "&divide;", "⋇": "&divonx;", "ђ": "&djcy;", "⌞": "&llcorner;", "⌍": "&dlcrop;", $: "&dollar;", "𝕕": "&dopf;", "≑": "&eDot;", "∸": "&minusd;", "∔": "&plusdo;", "⊡": "&sdotb;", "⌟": "&lrcorner;", "⌌": "&drcrop;", "𝒹": "&dscr;", "ѕ": "&dscy;", "⧶": "&dsol;", "đ": "&dstrok;", "⋱": "&dtdot;", "▿": "&triangledown;", "⦦": "&dwangle;", "џ": "&dzcy;", "⟿": "&dzigrarr;", "é": "&eacute;", "⩮": "&easter;", "ě": "&ecaron;", "≖": "&eqcirc;", "ê": "&ecirc;", "≕": "&eqcolon;", "э": "&ecy;", "ė": "&edot;", "≒": "&fallingdotseq;", "𝔢": "&efr;", "⪚": "&eg;", "è": "&egrave;", "⪖": "&eqslantgtr;", "⪘": "&egsdot;", "⪙": "&el;", "⏧": "&elinters;", "ℓ": "&ell;", "⪕": "&eqslantless;", "⪗": "&elsdot;", "ē": "&emacr;", "∅": "&varnothing;", " ": "&emsp13;", " ": "&emsp14;", " ": "&emsp;", "ŋ": "&eng;", " ": "&ensp;", "ę": "&eogon;", "𝕖": "&eopf;", "⋕": "&epar;", "⧣": "&eparsl;", "⩱": "&eplus;", "ε": "&epsilon;", "ϵ": "&varepsilon;", "=": "&equals;", "≟": "&questeq;", "⩸": "&equivDD;", "⧥": "&eqvparsl;", "≓": "&risingdotseq;", "⥱": "&erarr;", "ℯ": "&escr;", "η": "&eta;", "ð": "&eth;", "ë": "&euml;", "€": "&euro;", "!": "&excl;", "ф": "&fcy;", "♀": "&female;", "ﬃ": "&ffilig;", "ﬀ": "&fflig;", "ﬄ": "&ffllig;", "𝔣": "&ffr;", "ﬁ": "&filig;", fj: "&fjlig;", "♭": "&flat;", "ﬂ": "&fllig;", "▱": "&fltns;", "ƒ": "&fnof;", "𝕗": "&fopf;", "⋔": "&pitchfork;", "⫙": "&forkv;", "⨍": "&fpartint;", "½": "&half;", "⅓": "&frac13;", "¼": "&frac14;", "⅕": "&frac15;", "⅙": "&frac16;", "⅛": "&frac18;", "⅔": "&frac23;", "⅖": "&frac25;", "¾": "&frac34;", "⅗": "&frac35;", "⅜": "&frac38;", "⅘": "&frac45;", "⅚": "&frac56;", "⅝": "&frac58;", "⅞": "&frac78;", "⁄": "&frasl;", "⌢": "&sfrown;", "𝒻": "&fscr;", "⪌": "&gtreqqless;", "ǵ": "&gacute;", "γ": "&gamma;", "⪆": "&gtrapprox;", "ğ": "&gbreve;", "ĝ": "&gcirc;", "г": "&gcy;", "ġ": "&gdot;", "⪩": "&gescc;", "⪀": "&gesdot;", "⪂": "&gesdoto;", "⪄": "&gesdotol;", "⋛︀": "&gesl;", "⪔": "&gesles;", "𝔤": "&gfr;", "ℷ": "&gimel;", "ѓ": "&gjcy;", "⪒": "&glE;", "⪥": "&gla;", "⪤": "&glj;", "≩": "&gneqq;", "⪊": "&gnapprox;", "⪈": "&gneq;", "⋧": "&gnsim;", "𝕘": "&gopf;", "ℊ": "&gscr;", "⪎": "&gsime;", "⪐": "&gsiml;", "⪧": "&gtcc;", "⩺": "&gtcir;", "⋗": "&gtrdot;", "⦕": "&gtlPar;", "⩼": "&gtquest;", "⥸": "&gtrarr;", "≩︀": "&gvnE;", "ъ": "&hardcy;", "⥈": "&harrcir;", "↭": "&leftrightsquigarrow;", "ℏ": "&plankv;", "ĥ": "&hcirc;", "♥": "&heartsuit;", "…": "&mldr;", "⊹": "&hercon;", "𝔥": "&hfr;", "⤥": "&searhk;", "⤦": "&swarhk;", "⇿": "&hoarr;", "∻": "&homtht;", "↩": "&larrhk;", "↪": "&rarrhk;", "𝕙": "&hopf;", "―": "&horbar;", "𝒽": "&hscr;", "ħ": "&hstrok;", "⁃": "&hybull;", "í": "&iacute;", "î": "&icirc;", "и": "&icy;", "е": "&iecy;", "¡": "&iexcl;", "𝔦": "&ifr;", "ì": "&igrave;", "⨌": "&qint;", "∭": "&tint;", "⧜": "&iinfin;", "℩": "&iiota;", "ĳ": "&ijlig;", "ī": "&imacr;", "ı": "&inodot;", "⊷": "&imof;", "Ƶ": "&imped;", "℅": "&incare;", "∞": "&infin;", "⧝": "&infintie;", "⊺": "&intercal;", "⨗": "&intlarhk;", "⨼": "&iprod;", "ё": "&iocy;", "į": "&iogon;", "𝕚": "&iopf;", "ι": "&iota;", "¿": "&iquest;", "𝒾": "&iscr;", "⋹": "&isinE;", "⋵": "&isindot;", "⋴": "&isins;", "⋳": "&isinsv;", "ĩ": "&itilde;", "і": "&iukcy;", "ï": "&iuml;", "ĵ": "&jcirc;", "й": "&jcy;", "𝔧": "&jfr;", "ȷ": "&jmath;", "𝕛": "&jopf;", "𝒿": "&jscr;", "ј": "&jsercy;", "є": "&jukcy;", "κ": "&kappa;", "ϰ": "&varkappa;", "ķ": "&kcedil;", "к": "&kcy;", "𝔨": "&kfr;", "ĸ": "&kgreen;", "х": "&khcy;", "ќ": "&kjcy;", "𝕜": "&kopf;", "𝓀": "&kscr;", "⤛": "&lAtail;", "⤎": "&lBarr;", "⪋": "&lesseqqgtr;", "⥢": "&lHar;", "ĺ": "&lacute;", "⦴": "&laemptyv;", "λ": "&lambda;", "⦑": "&langd;", "⪅": "&lessapprox;", "«": "&laquo;", "⤟": "&larrbfs;", "⤝": "&larrfs;", "↫": "&looparrowleft;", "⤹": "&larrpl;", "⥳": "&larrsim;", "↢": "&leftarrowtail;", "⪫": "&lat;", "⤙": "&latail;", "⪭": "&late;", "⪭︀": "&lates;", "⤌": "&lbarr;", "❲": "&lbbrk;", "{": "&lcub;", "[": "&lsqb;", "⦋": "&lbrke;", "⦏": "&lbrksld;", "⦍": "&lbrkslu;", "ľ": "&lcaron;", "ļ": "&lcedil;", "л": "&lcy;", "⤶": "&ldca;", "⥧": "&ldrdhar;", "⥋": "&ldrushar;", "↲": "&ldsh;", "≤": "&leq;", "⇇": "&llarr;", "⋋": "&lthree;", "⪨": "&lescc;", "⩿": "&lesdot;", "⪁": "&lesdoto;", "⪃": "&lesdotor;", "⋚︀": "&lesg;", "⪓": "&lesges;", "⋖": "&ltdot;", "⥼": "&lfisht;", "𝔩": "&lfr;", "⪑": "&lgE;", "⥪": "&lharul;", "▄": "&lhblk;", "љ": "&ljcy;", "⥫": "&llhard;", "◺": "&lltri;", "ŀ": "&lmidot;", "⎰": "&lmoustache;", "≨": "&lneqq;", "⪉": "&lnapprox;", "⪇": "&lneq;", "⋦": "&lnsim;", "⟬": "&loang;", "⇽": "&loarr;", "⟼": "&xmap;", "↬": "&rarrlp;", "⦅": "&lopar;", "𝕝": "&lopf;", "⨭": "&loplus;", "⨴": "&lotimes;", "∗": "&lowast;", "◊": "&lozenge;", "(": "&lpar;", "⦓": "&lparlt;", "⥭": "&lrhard;", "‎": "&lrm;", "⊿": "&lrtri;", "‹": "&lsaquo;", "𝓁": "&lscr;", "⪍": "&lsime;", "⪏": "&lsimg;", "‚": "&sbquo;", "ł": "&lstrok;", "⪦": "&ltcc;", "⩹": "&ltcir;", "⋉": "&ltimes;", "⥶": "&ltlarr;", "⩻": "&ltquest;", "⦖": "&ltrPar;", "◃": "&triangleleft;", "⥊": "&lurdshar;", "⥦": "&luruhar;", "≨︀": "&lvnE;", "∺": "&mDDot;", "¯": "&strns;", "♂": "&male;", "✠": "&maltese;", "▮": "&marker;", "⨩": "&mcomma;", "м": "&mcy;", "—": "&mdash;", "𝔪": "&mfr;", "℧": "&mho;", "µ": "&micro;", "⫰": "&midcir;", "−": "&minus;", "⨪": "&minusdu;", "⫛": "&mlcp;", "⊧": "&models;", "𝕞": "&mopf;", "𝓂": "&mscr;", "μ": "&mu;", "⊸": "&mumap;", "⋙̸": "&nGg;", "≫⃒": "&nGt;", "⇍": "&nlArr;", "⇎": "&nhArr;", "⋘̸": "&nLl;", "≪⃒": "&nLt;", "⇏": "&nrArr;", "⊯": "&nVDash;", "⊮": "&nVdash;", "ń": "&nacute;", "∠⃒": "&nang;", "⩰̸": "&napE;", "≋̸": "&napid;", "ŉ": "&napos;", "♮": "&natural;", "⩃": "&ncap;", "ň": "&ncaron;", "ņ": "&ncedil;", "⩭̸": "&ncongdot;", "⩂": "&ncup;", "н": "&ncy;", "–": "&ndash;", "⇗": "&neArr;", "⤤": "&nearhk;", "≐̸": "&nedot;", "⤨": "&toea;", "𝔫": "&nfr;", "↮": "&nleftrightarrow;", "⫲": "&nhpar;", "⋼": "&nis;", "⋺": "&nisd;", "њ": "&njcy;", "≦̸": "&nleqq;", "↚": "&nleftarrow;", "‥": "&nldr;", "𝕟": "&nopf;", "¬": "&not;", "⋹̸": "&notinE;", "⋵̸": "&notindot;", "⋷": "&notinvb;", "⋶": "&notinvc;", "⋾": "&notnivb;", "⋽": "&notnivc;", "⫽⃥": "&nparsl;", "∂̸": "&npart;", "⨔": "&npolint;", "↛": "&nrightarrow;", "⤳̸": "&nrarrc;", "↝̸": "&nrarrw;", "𝓃": "&nscr;", "⊄": "&nsub;", "⫅̸": "&nsubseteqq;", "⊅": "&nsup;", "⫆̸": "&nsupseteqq;", "ñ": "&ntilde;", "ν": "&nu;", "#": "&num;", "№": "&numero;", " ": "&numsp;", "⊭": "&nvDash;", "⤄": "&nvHarr;", "≍⃒": "&nvap;", "⊬": "&nvdash;", "≥⃒": "&nvge;", ">⃒": "&nvgt;", "⧞": "&nvinfin;", "⤂": "&nvlArr;", "≤⃒": "&nvle;", "<⃒": "&nvlt;", "⊴⃒": "&nvltrie;", "⤃": "&nvrArr;", "⊵⃒": "&nvrtrie;", "∼⃒": "&nvsim;", "⇖": "&nwArr;", "⤣": "&nwarhk;", "⤧": "&nwnear;", "ó": "&oacute;", "ô": "&ocirc;", "о": "&ocy;", "ő": "&odblac;", "⨸": "&odiv;", "⦼": "&odsold;", "œ": "&oelig;", "⦿": "&ofcir;", "𝔬": "&ofr;", "˛": "&ogon;", "ò": "&ograve;", "⧁": "&ogt;", "⦵": "&ohbar;", "⦾": "&olcir;", "⦻": "&olcross;", "⧀": "&olt;", "ō": "&omacr;", "ω": "&omega;", "ο": "&omicron;", "⦶": "&omid;", "𝕠": "&oopf;", "⦷": "&opar;", "⦹": "&operp;", "∨": "&vee;", "⩝": "&ord;", "ℴ": "&oscr;", "ª": "&ordf;", "º": "&ordm;", "⊶": "&origof;", "⩖": "&oror;", "⩗": "&orslope;", "⩛": "&orv;", "ø": "&oslash;", "⊘": "&osol;", "õ": "&otilde;", "⨶": "&otimesas;", "ö": "&ouml;", "⌽": "&ovbar;", "¶": "&para;", "⫳": "&parsim;", "⫽": "&parsl;", "п": "&pcy;", "%": "&percnt;", ".": "&period;", "‰": "&permil;", "‱": "&pertenk;", "𝔭": "&pfr;", "φ": "&phi;", "ϕ": "&varphi;", "☎": "&phone;", "π": "&pi;", "ϖ": "&varpi;", "ℎ": "&planckh;", "+": "&plus;", "⨣": "&plusacir;", "⨢": "&pluscir;", "⨥": "&plusdu;", "⩲": "&pluse;", "⨦": "&plussim;", "⨧": "&plustwo;", "⨕": "&pointint;", "𝕡": "&popf;", "£": "&pound;", "⪳": "&prE;", "⪷": "&precapprox;", "⪹": "&prnap;", "⪵": "&prnE;", "⋨": "&prnsim;", "′": "&prime;", "⌮": "&profalar;", "⌒": "&profline;", "⌓": "&profsurf;", "⊰": "&prurel;", "𝓅": "&pscr;", "ψ": "&psi;", " ": "&puncsp;", "𝔮": "&qfr;", "𝕢": "&qopf;", "⁗": "&qprime;", "𝓆": "&qscr;", "⨖": "&quatint;", "?": "&quest;", "⤜": "&rAtail;", "⥤": "&rHar;", "∽̱": "&race;", "ŕ": "&racute;", "⦳": "&raemptyv;", "⦒": "&rangd;", "⦥": "&range;", "»": "&raquo;", "⥵": "&rarrap;", "⤠": "&rarrbfs;", "⤳": "&rarrc;", "⤞": "&rarrfs;", "⥅": "&rarrpl;", "⥴": "&rarrsim;", "↣": "&rightarrowtail;", "↝": "&rightsquigarrow;", "⤚": "&ratail;", "∶": "&ratio;", "❳": "&rbbrk;", "}": "&rcub;", "]": "&rsqb;", "⦌": "&rbrke;", "⦎": "&rbrksld;", "⦐": "&rbrkslu;", "ř": "&rcaron;", "ŗ": "&rcedil;", "р": "&rcy;", "⤷": "&rdca;", "⥩": "&rdldhar;", "↳": "&rdsh;", "▭": "&rect;", "⥽": "&rfisht;", "𝔯": "&rfr;", "⥬": "&rharul;", "ρ": "&rho;", "ϱ": "&varrho;", "⇉": "&rrarr;", "⋌": "&rthree;", "˚": "&ring;", "‏": "&rlm;", "⎱": "&rmoustache;", "⫮": "&rnmid;", "⟭": "&roang;", "⇾": "&roarr;", "⦆": "&ropar;", "𝕣": "&ropf;", "⨮": "&roplus;", "⨵": "&rotimes;", ")": "&rpar;", "⦔": "&rpargt;", "⨒": "&rppolint;", "›": "&rsaquo;", "𝓇": "&rscr;", "⋊": "&rtimes;", "▹": "&triangleright;", "⧎": "&rtriltri;", "⥨": "&ruluhar;", "℞": "&rx;", "ś": "&sacute;", "⪴": "&scE;", "⪸": "&succapprox;", "š": "&scaron;", "ş": "&scedil;", "ŝ": "&scirc;", "⪶": "&succneqq;", "⪺": "&succnapprox;", "⋩": "&succnsim;", "⨓": "&scpolint;", "с": "&scy;", "⋅": "&sdot;", "⩦": "&sdote;", "⇘": "&seArr;", "§": "&sect;", ";": "&semi;", "⤩": "&tosa;", "✶": "&sext;", "𝔰": "&sfr;", "♯": "&sharp;", "щ": "&shchcy;", "ш": "&shcy;", "­": "&shy;", "σ": "&sigma;", "ς": "&varsigma;", "⩪": "&simdot;", "⪞": "&simg;", "⪠": "&simgE;", "⪝": "&siml;", "⪟": "&simlE;", "≆": "&simne;", "⨤": "&simplus;", "⥲": "&simrarr;", "⨳": "&smashp;", "⧤": "&smeparsl;", "⌣": "&ssmile;", "⪪": "&smt;", "⪬": "&smte;", "⪬︀": "&smtes;", "ь": "&softcy;", "/": "&sol;", "⧄": "&solb;", "⌿": "&solbar;", "𝕤": "&sopf;", "♠": "&spadesuit;", "⊓︀": "&sqcaps;", "⊔︀": "&sqcups;", "𝓈": "&sscr;", "☆": "&star;", "⊂": "&subset;", "⫅": "&subseteqq;", "⪽": "&subdot;", "⫃": "&subedot;", "⫁": "&submult;", "⫋": "&subsetneqq;", "⊊": "&subsetneq;", "⪿": "&subplus;", "⥹": "&subrarr;", "⫇": "&subsim;", "⫕": "&subsub;", "⫓": "&subsup;", "♪": "&sung;", "¹": "&sup1;", "²": "&sup2;", "³": "&sup3;", "⫆": "&supseteqq;", "⪾": "&supdot;", "⫘": "&supdsub;", "⫄": "&supedot;", "⟉": "&suphsol;", "⫗": "&suphsub;", "⥻": "&suplarr;", "⫂": "&supmult;", "⫌": "&supsetneqq;", "⊋": "&supsetneq;", "⫀": "&supplus;", "⫈": "&supsim;", "⫔": "&supsub;", "⫖": "&supsup;", "⇙": "&swArr;", "⤪": "&swnwar;", "ß": "&szlig;", "⌖": "&target;", "τ": "&tau;", "ť": "&tcaron;", "ţ": "&tcedil;", "т": "&tcy;", "⌕": "&telrec;", "𝔱": "&tfr;", "θ": "&theta;", "ϑ": "&vartheta;", "þ": "&thorn;", "×": "&times;", "⨱": "&timesbar;", "⨰": "&timesd;", "⌶": "&topbot;", "⫱": "&topcir;", "𝕥": "&topf;", "⫚": "&topfork;", "‴": "&tprime;", "▵": "&utri;", "≜": "&trie;", "◬": "&tridot;", "⨺": "&triminus;", "⨹": "&triplus;", "⧍": "&trisb;", "⨻": "&tritime;", "⏢": "&trpezium;", "𝓉": "&tscr;", "ц": "&tscy;", "ћ": "&tshcy;", "ŧ": "&tstrok;", "⥣": "&uHar;", "ú": "&uacute;", "ў": "&ubrcy;", "ŭ": "&ubreve;", "û": "&ucirc;", "у": "&ucy;", "ű": "&udblac;", "⥾": "&ufisht;", "𝔲": "&ufr;", "ù": "&ugrave;", "▀": "&uhblk;", "⌜": "&ulcorner;", "⌏": "&ulcrop;", "◸": "&ultri;", "ū": "&umacr;", "ų": "&uogon;", "𝕦": "&uopf;", "υ": "&upsilon;", "⇈": "&uuarr;", "⌝": "&urcorner;", "⌎": "&urcrop;", "ů": "&uring;", "◹": "&urtri;", "𝓊": "&uscr;", "⋰": "&utdot;", "ũ": "&utilde;", "ü": "&uuml;", "⦧": "&uwangle;", "⫨": "&vBar;", "⫩": "&vBarv;", "⦜": "&vangrt;", "⊊︀": "&vsubne;", "⫋︀": "&vsubnE;", "⊋︀": "&vsupne;", "⫌︀": "&vsupnE;", "в": "&vcy;", "⊻": "&veebar;", "≚": "&veeeq;", "⋮": "&vellip;", "𝔳": "&vfr;", "𝕧": "&vopf;", "𝓋": "&vscr;", "⦚": "&vzigzag;", "ŵ": "&wcirc;", "⩟": "&wedbar;", "≙": "&wedgeq;", "℘": "&wp;", "𝔴": "&wfr;", "𝕨": "&wopf;", "𝓌": "&wscr;", "𝔵": "&xfr;", "ξ": "&xi;", "⋻": "&xnis;", "𝕩": "&xopf;", "𝓍": "&xscr;", "ý": "&yacute;", "я": "&yacy;", "ŷ": "&ycirc;", "ы": "&ycy;", "¥": "&yen;", "𝔶": "&yfr;", "ї": "&yicy;", "𝕪": "&yopf;", "𝓎": "&yscr;", "ю": "&yucy;", "ÿ": "&yuml;", "ź": "&zacute;", "ž": "&zcaron;", "з": "&zcy;", "ż": "&zdot;", "ζ": "&zeta;", "𝔷": "&zfr;", "ж": "&zhcy;", "⇝": "&zigrarr;", "𝕫": "&zopf;", "𝓏": "&zscr;", "‍": "&zwj;", "‌": "&zwnj;" } } };
  var numericUnicodeMap = {};
  Object.defineProperty(numericUnicodeMap, "__esModule", { value: true });
  numericUnicodeMap.numericUnicodeMap = { 0: 65533, 128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376 };
  var surrogatePairs = {};
  Object.defineProperty(surrogatePairs, "__esModule", { value: true });
  surrogatePairs.fromCodePoint = String.fromCodePoint || function(astralCodePoint) {
    return String.fromCharCode(Math.floor((astralCodePoint - 65536) / 1024) + 55296, (astralCodePoint - 65536) % 1024 + 56320);
  };
  surrogatePairs.getCodePoint = String.prototype.codePointAt ? function(input, position) {
    return input.codePointAt(position);
  } : function(input, position) {
    return (input.charCodeAt(position) - 55296) * 1024 + input.charCodeAt(position + 1) - 56320 + 65536;
  };
  surrogatePairs.highSurrogateFrom = 55296;
  surrogatePairs.highSurrogateTo = 56319;
  var __assign = commonjsGlobal && commonjsGlobal.__assign || function() {
    __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  Object.defineProperty(lib, "__esModule", { value: true });
  var named_references_1 = namedReferences;
  var numeric_unicode_map_1 = numericUnicodeMap;
  var surrogate_pairs_1 = surrogatePairs;
  var allNamedReferences = __assign(__assign({}, named_references_1.namedReferences), { all: named_references_1.namedReferences.html5 });
  var encodeRegExps = {
    specialChars: /[<>'"&]/g,
    nonAscii: /[<>'"&\u0080-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    nonAsciiPrintable: /[<>'"&\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    nonAsciiPrintableOnly: /[\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g,
    extensive: /[\x01-\x0c\x0e-\x1f\x21-\x2c\x2e-\x2f\x3a-\x40\x5b-\x60\x7b-\x7d\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g
  };
  var defaultEncodeOptions = {
    mode: "specialChars",
    level: "all",
    numeric: "decimal"
  };
  function encode(text, _a) {
    var _b = _a === void 0 ? defaultEncodeOptions : _a, _c = _b.mode, mode = _c === void 0 ? "specialChars" : _c, _d = _b.numeric, numeric = _d === void 0 ? "decimal" : _d, _e = _b.level, level = _e === void 0 ? "all" : _e;
    if (!text) {
      return "";
    }
    var encodeRegExp = encodeRegExps[mode];
    var references = allNamedReferences[level].characters;
    var isHex = numeric === "hexadecimal";
    encodeRegExp.lastIndex = 0;
    var _b = encodeRegExp.exec(text);
    var _c;
    if (_b) {
      _c = "";
      var _d = 0;
      do {
        if (_d !== _b.index) {
          _c += text.substring(_d, _b.index);
        }
        var _e = _b[0];
        var result_1 = references[_e];
        if (!result_1) {
          var code_1 = _e.length > 1 ? surrogate_pairs_1.getCodePoint(_e, 0) : _e.charCodeAt(0);
          result_1 = (isHex ? "&#x" + code_1.toString(16) : "&#" + code_1) + ";";
        }
        _c += result_1;
        _d = _b.index + _e.length;
      } while (_b = encodeRegExp.exec(text));
      if (_d !== text.length) {
        _c += text.substring(_d);
      }
    } else {
      _c = text;
    }
    return _c;
  }
  lib.encode = encode;
  var defaultDecodeOptions = {
    scope: "body",
    level: "all"
  };
  var strict = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
  var attribute = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;
  var baseDecodeRegExps = {
    xml: {
      strict,
      attribute,
      body: named_references_1.bodyRegExps.xml
    },
    html4: {
      strict,
      attribute,
      body: named_references_1.bodyRegExps.html4
    },
    html5: {
      strict,
      attribute,
      body: named_references_1.bodyRegExps.html5
    }
  };
  var decodeRegExps = __assign(__assign({}, baseDecodeRegExps), { all: baseDecodeRegExps.html5 });
  var fromCharCode = String.fromCharCode;
  var outOfBoundsChar = fromCharCode(65533);
  var defaultDecodeEntityOptions = {
    level: "all"
  };
  function decodeEntity(entity, _a) {
    var _b = (_a === void 0 ? defaultDecodeEntityOptions : _a).level, level = _b === void 0 ? "all" : _b;
    if (!entity) {
      return "";
    }
    var _b = entity;
    entity[entity.length - 1];
    {
      var decodeResultByReference_1 = allNamedReferences[level].entities[entity];
      if (decodeResultByReference_1) {
        _b = decodeResultByReference_1;
      } else if (entity[0] === "&" && entity[1] === "#") {
        var decodeSecondChar_1 = entity[2];
        var decodeCode_1 = decodeSecondChar_1 == "x" || decodeSecondChar_1 == "X" ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
        _b = decodeCode_1 >= 1114111 ? outOfBoundsChar : decodeCode_1 > 65535 ? surrogate_pairs_1.fromCodePoint(decodeCode_1) : fromCharCode(numeric_unicode_map_1.numericUnicodeMap[decodeCode_1] || decodeCode_1);
      }
    }
    return _b;
  }
  lib.decodeEntity = decodeEntity;
  function decode(text, _a) {
    var decodeSecondChar_1 = _a === void 0 ? defaultDecodeOptions : _a, decodeCode_1 = decodeSecondChar_1.level, level = decodeCode_1 === void 0 ? "all" : decodeCode_1, _b = decodeSecondChar_1.scope, scope = _b === void 0 ? level === "xml" ? "strict" : "body" : _b;
    if (!text) {
      return "";
    }
    var decodeRegExp = decodeRegExps[level][scope];
    var references = allNamedReferences[level].entities;
    var isAttribute2 = scope === "attribute";
    var isStrict = scope === "strict";
    decodeRegExp.lastIndex = 0;
    var replaceMatch_1 = decodeRegExp.exec(text);
    var replaceResult_1;
    if (replaceMatch_1) {
      replaceResult_1 = "";
      var replaceLastIndex_1 = 0;
      do {
        if (replaceLastIndex_1 !== replaceMatch_1.index) {
          replaceResult_1 += text.substring(replaceLastIndex_1, replaceMatch_1.index);
        }
        var replaceInput_1 = replaceMatch_1[0];
        var decodeResult_1 = replaceInput_1;
        var decodeEntityLastChar_2 = replaceInput_1[replaceInput_1.length - 1];
        if (isAttribute2 && decodeEntityLastChar_2 === "=") {
          decodeResult_1 = replaceInput_1;
        } else if (isStrict && decodeEntityLastChar_2 !== ";") {
          decodeResult_1 = replaceInput_1;
        } else {
          var decodeResultByReference_2 = references[replaceInput_1];
          if (decodeResultByReference_2) {
            decodeResult_1 = decodeResultByReference_2;
          } else if (replaceInput_1[0] === "&" && replaceInput_1[1] === "#") {
            var decodeSecondChar_2 = replaceInput_1[2];
            var decodeCode_2 = decodeSecondChar_2 == "x" || decodeSecondChar_2 == "X" ? parseInt(replaceInput_1.substr(3), 16) : parseInt(replaceInput_1.substr(2));
            decodeResult_1 = decodeCode_2 >= 1114111 ? outOfBoundsChar : decodeCode_2 > 65535 ? surrogate_pairs_1.fromCodePoint(decodeCode_2) : fromCharCode(numeric_unicode_map_1.numericUnicodeMap[decodeCode_2] || decodeCode_2);
          }
        }
        replaceResult_1 += decodeResult_1;
        replaceLastIndex_1 = replaceMatch_1.index + replaceInput_1.length;
      } while (replaceMatch_1 = decodeRegExp.exec(text));
      if (replaceLastIndex_1 !== text.length) {
        replaceResult_1 += text.substring(replaceLastIndex_1);
      }
    } else {
      replaceResult_1 = text;
    }
    return replaceResult_1;
  }
  var decode_1 = lib.decode = decode;
  const _tmpl$$2 = /* @__PURE__ */ template(`<div><input type=number>`), _tmpl$2$1 = /* @__PURE__ */ template(`<div><br>`), _tmpl$3$1 = /* @__PURE__ */ template(`<span>`);
  const WordSyncLyrics = (props) => {
    const playerInfo = usePlayerInfo();
    const [offset, setOffset] = createSignal(0);
    return (() => {
      const _el$ = _tmpl$$2(), _el$2 = _el$.firstChild;
      _el$.style.setProperty("overflow-y", "scroll");
      _el$.style.setProperty("height", "100%");
      _el$2.$$input = (e) => {
        console.log(e.currentTarget.valueAsNumber);
        setOffset(e.currentTarget.valueAsNumber);
      };
      insert(_el$, createComponent(For, {
        get each() {
          return props.data.wsy.line;
        },
        children: (line) => (() => {
          const _el$3 = _tmpl$2$1(), _el$4 = _el$3.firstChild;
          insert(_el$3, createComponent(For, {
            get each() {
              return line.word;
            },
            children: (word) => (() => {
              const _el$5 = _tmpl$3$1();
              insert(_el$5, (() => {
                const _c$ = createMemo(() => word.wordstring == "");
                return () => _c$() ? " " : decode_1(word.wordstring);
              })());
              createRenderEffect((_p$) => {
                var _a, _b;
                const _v$ = word.starttime <= (((_a = playerInfo.data) == null ? void 0 : _a.currentTime) ?? 0 + offset()) * 1e3 ? "white" : "gray", _v$2 = word.starttime <= (((_b = playerInfo.data) == null ? void 0 : _b.currentTime) ?? 0 + offset()) * 1e3 ? "bold" : "normal";
                _v$ !== _p$._v$ && ((_p$._v$ = _v$) != null ? _el$5.style.setProperty("color", _v$) : _el$5.style.removeProperty("color"));
                _v$2 !== _p$._v$2 && ((_p$._v$2 = _v$2) != null ? _el$5.style.setProperty("font-weight", _v$2) : _el$5.style.removeProperty("font-weight"));
                return _p$;
              }, {
                _v$: void 0,
                _v$2: void 0
              });
              return _el$5;
            })()
          }), _el$4);
          return _el$3;
        })()
      }), null);
      createRenderEffect(() => _el$2.value = offset());
      return _el$;
    })();
  };
  delegateEvents(["input"]);
  const _tmpl$$1 = /* @__PURE__ */ template(`<svg fill=none viewBox="0 0 15 15"height=20px width=20px><path fill=currentColor d="M13.5 3.5h.5v-.207l-.146-.147-.354.354zm-3-3l.354-.354L10.707 0H10.5v.5zm-3 4l.4-.3a.5.5 0 00-.9.3h.5zm.3.4l.4-.3-.4.3zm4.7 9.1h-10v1h10v-1zM2 13.5v-12H1v12h1zm11-10v10h1v-10h-1zM2.5 1h8V0h-8v1zm7.646-.146l3 3 .708-.708-3-3-.708.708zM2.5 14a.5.5 0 01-.5-.5H1A1.5 1.5 0 002.5 15v-1zm10 1a1.5 1.5 0 001.5-1.5h-1a.5.5 0 01-.5.5v1zM2 1.5a.5.5 0 01.5-.5V0A1.5 1.5 0 001 1.5h1zM6 11a1 1 0 01-1-1H4a2 2 0 002 2v-1zm1-1a1 1 0 01-1 1v1a2 2 0 002-2H7zM6 9a1 1 0 011 1h1a2 2 0 00-2-2v1zm0-1a2 2 0 00-2 2h1a1 1 0 011-1V8zm1-1.5V10h1V6.5H7zM8 7V4.5H7V7h1zm-.9-2.2l.3.4.8-.6-.3-.4-.8.6zm.3.4A4.5 4.5 0 0011 7V6a3.5 3.5 0 01-2.8-1.4l-.8.6z">`);
  function LyricIcon() {
    return _tmpl$$1();
  }
  const _tmpl$ = /* @__PURE__ */ template(`<button>`), _tmpl$2 = /* @__PURE__ */ template(`<div><div><div> - `), _tmpl$3 = /* @__PURE__ */ template(`<div>No song`), _tmpl$4 = /* @__PURE__ */ template(`<div>`), _tmpl$5 = /* @__PURE__ */ template(`<div>unexpected error`);
  const App = (props) => {
    const [show, setShow] = createSignal(true);
    const songInfo = useSongInfo();
    const [data] = createResource(() => {
      var _a, _b, _c;
      return {
        artist: (_a = songInfo.data) == null ? void 0 : _a.artist,
        album: (_b = songInfo.data) == null ? void 0 : _b.album,
        title: (_c = songInfo.data) == null ? void 0 : _c.title
      };
    }, async (data2) => {
      var _a, _b, _c, _d;
      if (!data2.artist && !data2.title && !data2.album) {
        return null;
      }
      let searchData;
      try {
        searchData = await search({
          key_artist: (_a = data2.artist) == null ? void 0 : _a[0],
          key_title: data2.title,
          key_album: data2.album,
          maxCount: 10
        });
      } catch (e) {
        console.log("Failed to search song", e);
        if (e instanceof ValiError) {
          console.log("issues:", e.issues);
        } else {
          try {
            console.log("Falling back to no album");
            searchData = await search({
              key_artist: (_b = data2.artist) == null ? void 0 : _b[0],
              key_title: data2.title,
              maxCount: 10
            });
          } catch (e2) {
            console.log("Failed to search song (fallback)", e2);
            if (e2 instanceof ValiError) {
              console.log("issues:", e2.issues);
            }
          }
        }
        return {
          type: "error",
          message: "Failed to search song"
        };
      }
      const lyricsId = (_d = (_c = searchData.response.songs.song) == null ? void 0 : _c[0]) == null ? void 0 : _d.lyricsId;
      if (!lyricsId) {
        return {
          type: "error",
          message: "No lyrics found"
        };
      }
      let lyricsData;
      try {
        lyricsData = {
          type: 3,
          data: await getWordSyncedLyrics({
            key_lyricsId: lyricsId
          })
        };
      } catch (e) {
        if (e instanceof ValiError) {
          console.warn("Failed to search song: ValiError. Falling back to non-sync lyrics. issues:", e.issues);
        } else {
          console.warn("Failed to search song. Falling back to non-sync lyrics.", e);
        }
        try {
          lyricsData = {
            type: 1,
            data: await getNotSyncedLyrics({
              key_lyricsId: lyricsId
            })
          };
        } catch (e2) {
          return {
            type: "error",
            message: "Failed to get lyrics (fallback)"
          };
        }
      }
      console.log("lyricsData", lyricsData);
      return lyricsData;
    });
    return (() => {
      const _el$ = _tmpl$2(), _el$3 = _el$.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild;
      insert(_el$, createComponent(Portal, {
        get mount() {
          return props.controlParent;
        },
        get children() {
          const _el$2 = _tmpl$();
          _el$2.$$click = () => {
            setShow(!show());
          };
          _el$2.style.setProperty("height", "36px");
          _el$2.style.setProperty("width", "36px");
          _el$2.style.setProperty("background", "none");
          _el$2.style.setProperty("border", "none");
          _el$2.style.setProperty("color", "white");
          _el$2.style.setProperty("margin-left", "2px");
          insert(_el$2, createComponent(LyricIcon, {}));
          return _el$2;
        }
      }), _el$3);
      _el$3.style.setProperty("position", "fixed");
      _el$3.style.setProperty("height", "calc(100vh - var(--ytmusic-nav-bar-height) - var(--ytmusic-player-bar-height))");
      _el$3.style.setProperty("width", "400px");
      _el$3.style.setProperty("background-color", "rgba(0, 0, 0, 0.8)");
      _el$3.style.setProperty("top", "var(--ytmusic-nav-bar-height)");
      _el$3.style.setProperty("right", "0");
      _el$3.style.setProperty("z-index", "3");
      _el$3.style.setProperty("color", "white");
      _el$3.style.setProperty("font-size", "medium");
      _el$3.style.setProperty("padding", "10px");
      insert(_el$4, () => {
        var _a;
        return (_a = songInfo.data) == null ? void 0 : _a.title;
      }, _el$5);
      insert(_el$4, () => {
        var _a;
        return (_a = songInfo.data) == null ? void 0 : _a.artist[0];
      }, null);
      insert(_el$3, createComponent(Switch, {
        get fallback() {
          return _tmpl$3();
        },
        get children() {
          return [createComponent(Match, {
            get when() {
              return data.loading;
            },
            children: "Loading..."
          }), createComponent(Match, {
            get when() {
              return data();
            },
            children: (data2) => createComponent(Switch, {
              get fallback() {
                return _tmpl$5();
              },
              get children() {
                return [createComponent(Match, {
                  get when() {
                    return data2().type == 1;
                  },
                  get children() {
                    const _el$7 = _tmpl$4();
                    _el$7.style.setProperty("white-space", "pre-wrap");
                    _el$7.style.setProperty("overflow-y", "scroll");
                    insert(_el$7, () => data2().data);
                    return _el$7;
                  }
                }), createComponent(Match, {
                  get when() {
                    return data2().type == 3;
                  },
                  get children() {
                    return createComponent(WordSyncLyrics, {
                      get data() {
                        return data2().data;
                      }
                    });
                  }
                }), createComponent(Match, {
                  get when() {
                    return data2().type == "error";
                  },
                  get children() {
                    return ["Error: ", createMemo(() => data2().message)];
                  }
                })];
              }
            })
          })];
        }
      }), null);
      createRenderEffect(() => (show() ? "block" : "none") != null ? _el$3.style.setProperty("display", show() ? "block" : "none") : _el$3.style.removeProperty("display"));
      return _el$;
    })();
  };
  delegateEvents(["click"]);
  let count = 0;
  const id = setInterval(() => {
    if (count > 30) {
      console.log("Failed to find parent element in 30 tries.");
      clearInterval(id);
      return;
    }
    const controlBefore = document.querySelector("ytmusic-player-bar #like-button-renderer");
    if (controlBefore) {
      const controlParent = document.createElement("div");
      controlBefore.after(controlParent);
      console.log("Found parent element.");
      startApp(document.body, controlParent);
    } else {
      count++;
    }
  }, 400);
  const startApp = (parent, controlParent) => {
    clearInterval(id);
    render(() => createComponent(App, {
      controlParent
    }), /* @__PURE__ */ (() => parent)());
  };

})();