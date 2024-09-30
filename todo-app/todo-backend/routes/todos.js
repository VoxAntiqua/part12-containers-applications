const express = require('express');
const { Todo } = require('../mongo');
const router = express.Router();
const { getAsync, setAsync } = require('../redis');

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({});
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false,
  });

  const currentCount = await getAsync('added_todos');
  const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
  await setAsync('added_todos', newCount);

  res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params;
  req.todo = await Todo.findById(id);
  if (!req.todo) return res.sendStatus(404);

  next();
};

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete();
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.json(req.todo);
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  const { text, done } = req.body;
  if (text !== undefined) req.todo.text = text;
  if (done !== undefined) req.todo.done = done;
  const updatedTodo = await req.todo.save();
  res.json(updatedTodo);
});

/* GET statistics */
router.get('/statistics', async (req, res) => {
  const addedTodos = (await getAsync('added_todos')) || 0;
  res.json({ added_todos: parseInt(addedTodos) });
});

router.use('/:id', findByIdMiddleware, singleRouter);

module.exports = router;
