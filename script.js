const KEY = 'aah_invoices';
const $ = id => document.getElementById(id);
let currentId = null;

const itemsEl = $('items');

function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}
function setAll(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

function money(n) { return 'Rs ' + Number(n).toLocaleString(); }

function addItem(d) {
    d = d || { name: '', qty: 1, price: 0 };
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML =
        '<input class="n" placeholder="Item / service">' +
        '<input class="q" type="number" min="1">' +
        '<input class="p" type="number" min="0">' +
        '<span class="amt">0</span>' +
        '<button class="x" type="button">&times;</button>';
    row.querySelector('.n').value = d.name;
    row.querySelector('.q').value = d.qty;
    row.querySelector('.p').value = d.price;
    row.addEventListener('input', calc);
    row.querySelector('.x').addEventListener('click', function () { row.remove(); calc(); });
    itemsEl.appendChild(row);
    calc();
}

function readItems() {
    return Array.from(itemsEl.children).map(function (r) {
        return {
            name: r.querySelector('.n').value,
            qty: Number(r.querySelector('.q').value) || 0,
            price: Number(r.querySelector('.p').value) || 0
        };
    });
}

function calc() {
    let total = 0;
    Array.from(itemsEl.children).forEach(function (r) {
        const q = Number(r.querySelector('.q').value) || 0;
        const p = Number(r.querySelector('.p').value) || 0;
        r.querySelector('.amt').textContent = (q * p).toLocaleString();
        total += q * p;
    });
    $('total').textContent = 'Total: ' + money(total);
    return total;
}

function nextNumber() {
    const n = getAll().length + 1;
    return 'AAH-' + String(n).padStart(3, '0');
}

function newInvoice() {
    currentId = null;
    $('client').value = '';
    $('date').value = new Date().toISOString().slice(0, 10);
    $('no').value = nextNumber();
    itemsEl.innerHTML = '';
    addItem();
}

function saveInvoice() {
    const client = $('client').value.trim();
    if (!client) { alert('Please enter the client name first.'); return; }
    const list = getAll();
    const data = {
        id: currentId || Date.now(),
        no: $('no').value,
        client: client,
        date: $('date').value,
        items: readItems(),
        total: calc()
    };
    const i = list.findIndex(function (x) { return x.id === data.id; });
    if (i >= 0) list[i] = data; else list.unshift(data);
    setAll(list);
    currentId = data.id;
    render();
    alert('Invoice saved.');
}

function loadInvoice(id) {
    const inv = getAll().find(function (x) { return x.id === id; });
    if (!inv) return;
    currentId = inv.id;
    $('client').value = inv.client;
    $('date').value = inv.date;
    $('no').value = inv.no;
    itemsEl.innerHTML = '';
    inv.items.forEach(addItem);
    location.hash = '#create';
}

function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    setAll(getAll().filter(function (x) { return x.id !== id; }));
    if (currentId === id) newInvoice();
    render();
}

function render() {
    const q = $('search').value.trim().toLowerCase();
    const list = getAll().filter(function (x) {
        return (x.client + ' ' + x.date + ' ' + x.no).toLowerCase().includes(q);
    });
    const box = $('list');
    box.innerHTML = '';
    if (!list.length) {
        box.innerHTML = '<p class="empty">No invoices found.</p>';
        return;
    }
    list.forEach(function (x) {
        const row = document.createElement('div');
        row.className = 'saved-row';
        const info = document.createElement('div');
        const b = document.createElement('b');
        b.textContent = x.client + ' (' + x.no + ')';
        const s = document.createElement('small');
        s.textContent = x.date + ' \u2022 ' + money(x.total);
        info.appendChild(b); info.appendChild(s);
        const btns = document.createElement('div');
        btns.className = 'btns';
        const open = document.createElement('button');
        open.textContent = 'Open';
        open.addEventListener('click', function () { loadInvoice(x.id); });
        const del = document.createElement('button');
        del.textContent = 'Delete'; del.className = 'ghost';
        del.addEventListener('click', function () { deleteInvoice(x.id); });
        btns.appendChild(open); btns.appendChild(del);
        row.appendChild(info); row.appendChild(btns);
        box.appendChild(row);
    });
}

$('addItem').addEventListener('click', function () { addItem(); });
$('save').addEventListener('click', saveInvoice);
$('pdf').addEventListener('click', function () { window.print(); });
$('newInv').addEventListener('click', newInvoice);
$('search').addEventListener('input', render);

window.addEventListener('load', function () {
    setTimeout(function () { $('loader').classList.add('hide'); }, 1800);
});

newInvoice();
render();