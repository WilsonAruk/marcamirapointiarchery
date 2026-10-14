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
  var PROFILE_NAMES = { R: 'Recurvo', C: 'Composto', B: 'Barebow', W1: 'Para W1', VI: 'Para VI' };

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
    bow: 'R', cls: 'adulto', sex: 'M', arrow: 'fina', step: 0.05, selected: null,
    // chave = perfil do arco + tipo de flecha, ex.: "R|fina", "C|larga"
    marks: {}
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
      if (!out.marks || typeof out.marks !== 'object') out.marks = {};
      // migra dados antigos (sem tipo de flecha) para "fina"
      Object.keys(out.marks).forEach(function (k) {
        if (k.indexOf('|') < 0) {
          if (!out.marks[k + '|fina']) out.marks[k + '|fina'] = out.marks[k];
          delete out.marks[k];
        }
      });
      if (out.arrow === 'grossa') out.arrow = 'larga';
      if (out.arrow !== 'fina' && out.arrow !== 'larga') out.arrow = 'fina';
      // renomeia perfis antigos "grossa" para "larga"
      Object.keys(out.marks).forEach(function (k) {
        if (/\|grossa$/.test(k)) {
          var nk = k.replace(/\|grossa$/, '|larga');
          if (!out.marks[nk]) out.marks[nk] = out.marks[k];
          delete out.marks[k];
        }
      });
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
    // Com menos de 2 distâncias medidas não há como estimar: as outras ficam sem marca.
    if (keys.length < 2) return null;
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
    var marks = marksFor(info);
    var saved = Object.keys(marks).map(Number).sort(function (x, y) { return x - y; });

    var visible = [];
    info.groups.forEach(function (g) { g.items.forEach(function (it) { visible.push(it.d); }); });
    if (visible.indexOf(state.selected) < 0 && saved.indexOf(state.selected) < 0) { state.selected = info.main; draft = null; }

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
    document.querySelectorAll('#arrow-group button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.arrow === state.arrow));
    });
    $('cls').value = state.cls;
    $('notice').hidden = !info.notice;
    $('notice').textContent = info.notice;
    $('profile').textContent = profileName(info);

    // escolha da distância (distâncias oficiais da categoria)
    var pick = $('dist-pick');
    pick.innerHTML = '';
    info.groups.forEach(function (g) {
      var wrap = document.createElement('div');
      wrap.className = 'pick-group';
      var lab = document.createElement('span');
      lab.className = 'pick-label';
      lab.textContent = g.title;
      wrap.appendChild(lab);
      var chips = document.createElement('div');
      chips.className = 'chips';
      g.items.forEach(function (it) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'chip' + (marks[it.d] !== undefined ? ' has-mark' : '');
        c.setAttribute('aria-pressed', String(it.d === state.selected));
        c.textContent = it.d + ' m';
        if (it.main) c.title = it.label;
        c.setAttribute('aria-label', it.d + ' metros' + (marks[it.d] !== undefined ? ', já tem marcação' : ''));
        c.addEventListener('click', function () { state.selected = it.d; draft = null; persist(); render(); });
        chips.appendChild(c);
      });
      wrap.appendChild(chips);
      pick.appendChild(wrap);
    });

    // lista: todas as marcações salvas (todos os arcos e flechas), perfil atual primeiro
    listEl.innerHTML = '';
    var currentKey = info.profileKey + '|' + state.arrow;
    var keys = Object.keys(state.marks).filter(function (k) { return Object.keys(state.marks[k]).length > 0; });
    keys.sort(function (x, y) { return (x === currentKey ? -1 : y === currentKey ? 1 : x < y ? -1 : 1); });
    var totalSaved = 0;
    keys.forEach(function (k) { totalSaved += Object.keys(state.marks[k]).length; });
    $('saved-count').textContent = totalSaved === 1 ? '1 marcação' : totalSaved + ' marcações';
    if (totalSaved === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Nenhuma marcação salva ainda. Escolha a distância acima, ajuste o valor e toque em "Salvar marcação".';
      listEl.appendChild(empty);
    }
    keys.forEach(function (k) {
      var pm = state.marks[k];
      var ds = Object.keys(pm).map(Number).sort(function (x, y) { return x - y; });
      var parts = k.split('|');
      var lastEnv = null;
      var vs = ds.map(function (d) { return pm[d]; });
      var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), sp = (mx - mn) || 1;
      ds.forEach(function (d) {
        var v = pm[d];
        var env = d <= 25 ? 'Indoor' : 'Outdoor';
        if (env !== lastEnv) {
          // cabeçalho: "COMPOSTO · FLECHA LARGA" + etiqueta Indoor/Outdoor ao lado
          var head = document.createElement('div');
          head.className = 'group-head' + (k === currentKey ? ' current' : '');
          head.innerHTML = '<span class="gh-title"><strong></strong><em></em></span><span class="gh-sel"></span>';
          head.querySelector('strong').textContent = PROFILE_NAMES[parts[0]] + ' · Flecha ' + parts[1];
          var t = head.querySelector('em');
          t.textContent = env;
          t.className = 'tag tag-' + env.toLowerCase();
          head.querySelector('.gh-sel').textContent = (k === currentKey && lastEnv === null) ? 'Selecionado' : '';
          listEl.appendChild(head);
          lastEnv = env;
        }
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'row';
        row.setAttribute('aria-pressed', String(k === currentKey && d === state.selected));
        row.innerHTML =
          '<span class="row-dist"><b></b></span>' +
          '<span class="rail" aria-hidden="true"><i class="measured"></i></span>' +
          '<span class="row-val measured"></span>';
        row.querySelector('b').textContent = d + ' m';
        row.querySelector('.rail i').style.left = (ds.length > 1 ? 4 + ((v - mn) / sp) * 92 : 50).toFixed(1) + '%';
        row.querySelector('.row-val').textContent = fmt(v);
        row.setAttribute('aria-label', d + ' metros, ' + env + ', ' + PROFILE_NAMES[parts[0]] + ', flecha ' + parts[1] + ', marcação ' + fmt(v) + '. Toque para editar');
        row.addEventListener('click', function () {
          // muda os filtros para o perfil desta marca
          if (parts[0] === 'W1') state.cls = 'w1';
          else if (parts[0] === 'VI') { if (state.cls !== 'vi1' && state.cls !== 'vi23') state.cls = 'vi1'; }
          else { state.bow = parts[0]; if (PARA.indexOf(state.cls) > 0) state.cls = 'adulto'; }
          state.arrow = parts[1];
          state.selected = d; draft = null; persist(); render();
          document.querySelector('.editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        listEl.appendChild(row);
      });
    });

    // editor
    var selMeasured = marks[state.selected] !== undefined;
    var est = selMeasured ? null : estimate(marks, state.selected);
    $('editor-title').textContent = selMeasured ? 'Editar marcação' : 'Nova marcação';
    $('sel-label').textContent = state.selected + ' metros';
    var badge = $('sel-badge');
    badge.textContent = selMeasured ? 'Salva' : 'Nova';
    badge.className = 'badge ' + (selMeasured ? 'measured' : 'est');
    var shown = draft !== null ? draft : (selMeasured ? marks[state.selected] : null);
    if (document.activeElement !== input) input.value = shown === null ? '' : fmt(shown);
    input.step = String(state.step);
    var sug = $('suggestion');
    sug.hidden = est === null || draft !== null;
    sug.textContent = est === null ? '' : 'Usar sugestão ~' + fmt(est);
    sug.onclick = function () { draft = round2(est); input.value = fmt(draft); render(); };
    $('btn-remove').hidden = !selMeasured;
  }

  function profileName(info) {
    var sex = state.sex === 'F' ? 'Feminino' : 'Masculino';
    var arrow = state.arrow === 'larga' ? 'Flecha larga' : 'Flecha fina';
    if (info.bowLocked) return CLASS_NAMES[state.cls] + ' · ' + sex + ' · ' + arrow;
    return BOW_NAMES[state.bow] + ' · ' + CLASS_NAMES[state.cls] + ' · ' + sex + ' · ' + arrow;
  }

  function currentInfo() { return buildDistances(state.bow, state.cls, state.sex); }
  function marksFor(info) {
    var key = info.profileKey + '|' + state.arrow;
    if (!state.marks[key]) state.marks[key] = {};
    return state.marks[key];
  }
  function currentMarks() { return marksFor(currentInfo()); }
  // valor de partida para os botões −/+ (rascunho, marca salva ou sugestão)
  function currentValue(marks) {
    if (draft !== null) return draft;
    return estimate(marks || currentMarks(), state.selected);
  }
  // valor que será salvo: só o que o usuário digitou/ajustou ou a marca já existente
  function valueToSave() {
    if (draft !== null) return draft;
    var m = currentMarks();
    return m[state.selected] !== undefined ? m[state.selected] : null;
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
  document.querySelectorAll('#arrow-group button').forEach(function (b) {
    b.addEventListener('click', function () { state.arrow = b.dataset.arrow; draft = null; persist(); render(); });
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
    var v = valueToSave();
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
