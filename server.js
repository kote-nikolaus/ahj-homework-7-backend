const http = require('http');
const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const uuid = require('uuid');
const app = new Koa();

const public = path.join(__dirname, '/public')
app.use(koaStatic(public));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUD, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

class Ticket {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.status = false;
    this.created = this.defineDate();
  }

  defineDate() {
    const date = new Date();
    const day = date.getDate();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    function addZero(time) {
      if (time < 10) {
        time = "0" + time;
      }
      return time;
    }

    const hours = addZero(date.getHours());
    const minutes = addZero(date.getMinutes());

    return `${day} ${month} ${year} г. в ${hours}:${minutes}`;
  }
}

class TicketFull extends Ticket {
  constructor(name, id, description) {
    super(name, id);
    this.description = description;
    this.status = false;
    this.created = this.defineDate();
  }
}

const tickets = [];

app.use(async ctx => {
    const { method } = ctx.request.query;
    switch (method) {
        case 'allTickets':
        {
          ctx.response.body = tickets;
          console.log(tickets)
          return;
        }
        case 'ticketById':
        {
          const { id } = ctx.request.query;
          ctx.response.body = tickets[id];
          return;
        }
        case 'createTicket':
        {
          const { name, description } = ctx.request.body;
          let ticket = new TicketFull(name, tickets.length, description);
          tickets.push(ticket);
          ctx.response.body = 'Ticket created';
          return;
        }
        case 'editTicket':
        {
          const { id, name, description } = ctx.request.body;
          tickets[id].name = name;
          tickets[id].description = description;
          ctx.response.body = 'Ticket edited';
          return;
        }
        case 'changeStatus':
        {
          const { id, status } = ctx.request.body;
          tickets[id].status = JSON.parse(status);
          ctx.response.body = 'Status changed';
          return;
        }
        default:
        {
          ctx.response.status = 404;
          return;
        }
    }
});

const port = process.env.PORT || 7070;
http.createServer(app.callback()).listen(port)
