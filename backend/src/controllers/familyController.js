const { FamilyMember } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const members = await FamilyMember.findAll();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const member = await FamilyMember.create(req.body);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};