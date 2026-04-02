const { TimelineEvent } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const events = await TimelineEvent.findAll({ order: [['date', 'ASC']] });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUpcoming = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const events = await TimelineEvent.findAll({
      where: { date: { $gte: today } },
      order: [['date', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const event = await TimelineEvent.create(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await TimelineEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: '事件不存在' });
    await event.update(req.body);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const event = await TimelineEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: '事件不存在' });
    await event.destroy();
    res.json({ message: '事件已删除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};