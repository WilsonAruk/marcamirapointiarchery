/* PointIArchery · Marcações de mira
 * App estático (HTML/CSS/JS puro). As marcações ficam salvas no navegador (localStorage).
 * Distâncias conforme regulamento da World Archery (outdoor 1440/70 m/50 m, indoor 18/25 m, para-tiro).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pointiarchery.sightmarks.v1';

  var BOW_NAMES = { R: 'Recurvo', C: 'Composto', B: 'Barebow' };
  var CLASS_NAMES = {
    adulto: 'Adulto', sub21: 'Sub-21', sub18: 'Sub-18', master: 'Master 50+',
    paraAberto: 'Para Aberto', w1: 'Para W1', vi1: 'Para VI 1', vi23: 'Para VI 2/3'
  };
  var PARA = ['paraAberto', 'w1', 'vi1', 'vi23'];

  // Distâncias do round 1440 (WA) por categoria/sexo.
  function distances1440(cls, sex) {
    if (cls === 'sub18' || cls === 'master') {
      return sex === 'F' ? [60, 50, 40, 30] : [70, 60, 50, 30];
    }
    return sex === 'F' ? [70, 60, 50, 30] : [90, 70, 50, 30];
  }

  // Monta as distâncias exibidas para a combinação escolhida.
  // Retorna { profileKey, main, notice, bowLocked, groups: [{title, sub, items:[{d, label, main}]}] }
  function buildDistances(bow, cls, sex) {
    var isPara = PARA.indexOf(cls) >= 0;
    var outdoor = [];
    var main;
    var notice = '';
    var bowLocked = false;
    var profileKey = bow;
    var indoor = isPara ? [18] : [18, 25];
    var outdoorSub = 'Campo · alvo de 122 cm';
    var indoorSub = 'Sala · alvo de 40 cm';

    if (cls === 'w1') {
      main = 50; outdoor = [50]; bowLocked = true; profileKey = 'W1';
      outdoorSub = 'Campo · alvo de 80 cm';
      notice = 'W1 compete com regras de composto (alvo de 80 cm a 50 m). As marcações ficam num perfil próprio.';
    } else if (cls === 'vi1' || cls === 'vi23') {
      main = 30; outdoor = [30]; bowLocked = true; profileKey = 'VI';
      outdoorSub = 'Campo · alvo de 80 cm';
      indoorSub = 'Sala · alvo de 60 cm';
      notice = 'Deficiência visual (VI): alvo de 80 cm a 30 m, com mira tátil e auxiliar. As marcações ficam num perfil próprio.';
    } else if (cls === 'paraAberto') {
      if (bow === 'B') {
        notice = 'Barebow não tem categoria no para-tiro. Selecione Recurvo ou Composto.';
        main = 50; outdoor = [50];
      } else if (bow === 'C') {
        main = 50; outdoor = [50];
        outdoorSub = 'Campo · alvo de 80 cm (5–10)';
      } else {
        main = 70; outdoor = [70];
      }
    } else if (bow === 'B') {
      main = 50; outdoor = [50];
      outdoorSub = 'Campo · alvo de 122 cm';
      notice = cls === 'sub18' || cls === 'master'
        ? 'Barebow: confira a distância de Sub-18/Master no regulamento da sua federação.'
        : '';
    } else {
      outdoor = distances1440(cls, sex);
      if (bow === 'C') {
        main = 50;
        if (outdoor.indexOf(50) < 0) outdoor.push(50);
        outdoorSub = 'Campo · 80 cm (50 m) e 122 cm (1440)';
      } else {
        main = (cls === 'sub18' || cls === 'master') ? 60 : 70;
        if (outdoor.indexOf(main) < 0) outdoor.push(main);
      }
    }

    outdoor = outdoor.slice().sort(function (a, b) { return a - b; });

    var mainLabel = 'Principal';
    if (cls === 'paraAberto') mainLabel = 'Principal · Para';
    else if (cls === 'w1') mainLabel = 'Principal · W1';
    else if (cls === 'vi1' || cls === 'vi23') mainLabel = 'Principal · VI';
    else if (bow === 'R' && main === 70) mainLabel = 'Principal · Olímpico';

    var hasRound1440 = !isPara && bow !== 'B';

    return {
      profileKey: profileKey,
      main: main,
      notice: notice,
      bowLocked: bowLocked,
      groups: [
        {
          title: 'Indoor', sub: indoorSub,
          items: indoor.map(function (d) { return { d: d, label: d === 18 ? 'Indoor · principal' : 'Indoor', main: false }; })
        },
        {
          title: 'Outdoor', sub: outdoorSub,
          items: outdoor.map(function (d) {
            return { d: d, label: d === main ? mainLabel : (hasRound1440 ? 'Round 1440' : ''), main: d === main };
          })
        }
      ]
    };
  }

  // ---------- Estado ----------
  var defaults = {
    bow: 'R', cls: 'adulto', sex: 'M', step: 0.05, selected: null,
    marks: { R: {}, C: {}, B: {}, W1: {}, VI: {} }
  };
  var state = load();
  var draft = null; // valor em edição ainda não salvo

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(defaults);
      var s = JSON.parse(raw);
      var out = clone(defaults);
      Object.keys(s).forEach(function (k) { out[k] = s[k]; });
      Object.keys(defaults.marks).forEach(function (k) { if (!out.marks[k]) out.marks[k] = {}; });
      return out;
    } catch (e) {
      return clone(defaults);
    }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* sem armazenamento */ }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function round2(v) { return Math.round(v * 100) / 100; }
  function fmt(v) { return v.toFixed(2); }

  // Interpola/extrapola linearmente a partir das marcas medidas do perfil.
  function estimate(marks, d) {
    if (marks[d] !== undefined) return marks[d];
    var keys = Object.keys(marks).map(Number).sort(function (a, b) { return a - b; });
    if (keys.length === 0) return null;
    if (keys.length === 1) return marks[keys[0]];
    var lo = null, hi = null;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] < d) lo = keys[i];
      if (keys[i] > d && hi === null) hi = keys[i];
    }
    if (lo === null) { lo = keys[0]; hi = keys[1]; }
    if (hi === null) { hi = keys[keys.length - 1]; lo = keys[keys.length - 2]; }
    return marks[lo] + (marks[hi] - marks[lo]) * (d - lo) / (hi - lo);
  }

  // ---------- Render ----------
  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('list');
  var input = $('val-input');

  function render() {
    var info = buildDistances(state.bow, state.cls, state.sex);
    var marks = state.marks[info.profileKey];

    var visible = [];
    info.groups.forEach(function (g) { g.items.forEach(function (it) { visible.push(it.d); }); });
    if (visible.indexOf(state.selected) < 0) { state.selected = info.main; draft = null; }

    // escala da régua
    var vals = visible.map(function (d) { return estimate(marks, d); }).filter(function (v) { return v !== null; });
    var min = vals.length ? Math.min.apply(null, vals) : 0;
    var max = vals.length ? Math.max.apply(null, vals) : 1;
    var span = (max - min) || 1;

    // filtros
    document.querySelectorAll('#bow-group button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.bow === state.bow && !info.bowLocked));
      b.disabled = info.bowLocked;
    });
    document.querySelectorAll('#sex-group button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.sex === state.sex));
    });
    document.querySelectorAll('#step-group button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(parseFloat(b.dataset.step) === state.step));
    });
    $('cls').value = state.cls;
    $('notice').hidden = !info.notice;
    $('notice').textContent = info.notice;
    $('profile').textContent = profileName(info);

    // lista
    var measuredCount = 0, total = 0;
    listEl.innerHTML = '';
    info.groups.forEach(function (g) {
      var head = document.createElement('div');
      head.className = 'group-head';
      head.innerHTML = '<strong></strong><span></span>';
      head.querySelector('strong').textContent = g.title;
      head.querySelector('span').textContent = g.sub;
      listEl.appendChild(head);

      g.items.forEach(function (it) {
        total++;
        var measured = marks[it.d] !== undefined;
        if (measured) measuredCount++;
        var v = estimate(marks, it.d);
        var cls = measured ? 'measured' : 'est';

        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'row';
        row.setAttribute('aria-pressed', String(it.d === state.selected));
        row.innerHTML =
          '<span class="row-dist"><b></b><small></small></span>' +
          '<span class="rail" aria-hidden="true"></span>' +
          '<span class="row-val"></span>';
        row.querySelector('b').textContent = it.d + ' m';
        var small = row.querySelector('small');
        small.textContent = it.label;
        if (it.main) small.className = 'main';
        if (v !== null) {
          var dot = document.createElement('i');
          dot.className = cls;
          dot.style.left = (4 + ((v - min) / span) * 92).toFixed(1) + '%';
          row.querySelector('.rail').appendChild(dot);
        }
        var valEl = row.querySelector('.row-val');
        valEl.className = 'row-val ' + cls;
        valEl.textContent = v === null ? '—' : (measured ? '' : '~') + fmt(v);
        row.setAttribute('aria-label', it.d + ' metros, ' + (v === null ? 'sem marcação' : fmt(v) + (measured ? ', medida' : ', estimada')));
        row.addEventListener('click', function () { state.selected = it.d; draft = null; persist(); render(); });
        listEl.appendChild(row);
      });
    });
    $('count-measured').textContent = measuredCount;
    $('count-est').textContent = total - measuredCount;

    // editor
    var selMeasured = marks[state.selected] !== undefined;
    var selGroup = info.groups.filter(function (g) { return g.items.some(function (it) { return it.d === state.selected; }); })[0];
    $('sel-context').textContent = selGroup ? selGroup.title + ' · ' + state.selected + ' m' : '';
    $('sel-label').textContent = state.selected + ' metros';
    var badge = $('sel-badge');
    badge.textContent = selMeasured ? 'Medida' : (estimate(marks, state.selected) === null ? 'Sem marca' : 'Estimada');
    badge.className = 'badge ' + (selMeasured ? 'measured' : 'est');
    var current = currentValue(marks);
    if (document.activeElement !== input) input.value = current === null ? '' : fmt(current);
    input.step = String(state.step);
    $('btn-remove').hidden = !selMeasured;
  }

  function profileName(info) {
    var sex = state.sex === 'F' ? 'Feminino' : 'Masculino';
    if (info.bowLocked) return CLASS_NAMES[state.cls] + ' · ' + sex;
    return BOW_NAMES[state.bow] + ' · ' + CLASS_NAMES[state.cls] + ' · ' + sex;
  }

  function currentInfo() { return buildDistances(state.bow, state.cls, state.sex); }
  function currentMarks() { return state.marks[currentInfo().profileKey]; }
  function currentValue(marks) {
    if (draft !== null) return draft;
    return estimate(marks || currentMarks(), state.selected);
  }

  function nudge(dir) {
    var v = currentValue();
    draft = round2((v === null ? 0 : v) + dir * state.step);
    input.value = fmt(draft);
    render();
  }

  // ---------- Eventos ----------
  document.querySelectorAll('#bow-group button').forEach(function (b) {
    b.addEventListener('click', function () { state.bow = b.dataset.bow; draft = null; persist(); render(); });
  });
  document.querySelectorAll('#sex-group button').forEach(function (b) {
    b.addEventListener('click', function () { state.sex = b.dataset.sex; draft = null; persist(); render(); });
  });
  document.querySelectorAll('#step-group button').forEach(function (b) {
    b.addEventListener('click', function () { state.step = parseFloat(b.dataset.step); persist(); render(); });
  });
  $('cls').addEventListener('change', function (e) { state.cls = e.target.value; draft = null; persist(); render(); });
  $('btn-minus').addEventListener('click', function () { nudge(-1); });
  $('btn-plus').addEventListener('click', function () { nudge(1); });
  input.addEventListener('input', function () {
    var v = parseFloat(String(input.value).replace(',', '.'));
    draft = isNaN(v) ? null : v;
  });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btn-save').click(); });
  $('btn-save').addEventListener('click', function () {
    var v = currentValue();
    if (v === null) { input.focus(); return; }
    currentMarks()[state.selected] = round2(v);
    draft = null;
    persist();
    input.blur();
    render();
  });
  $('btn-remove').addEventListener('click', function () {
    delete currentMarks()[state.selected];
    draft = null;
    persist();
    render();
  });
  $('btn-print').addEventListener('click', function () { window.print(); });

  render();
})();
