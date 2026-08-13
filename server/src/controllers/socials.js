const prisma = require('../db');

exports.getSocials = async (req, res) => {
  try {
    const socials = await prisma.socialLink.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'desc' }
    });
    res.json(socials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSocial = async (req, res) => {
  try {
    const { platform, url } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ error: 'Platform and URL are required' });
    }

    const social = await prisma.socialLink.create({
      data: {
        platform,
        url,
        userId: req.user.id
      }
    });

    res.status(201).json(social);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSocial = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.socialLink.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Social link not found' });
    }

    await prisma.socialLink.delete({ where: { id } });
    res.json({ message: 'Social link removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
