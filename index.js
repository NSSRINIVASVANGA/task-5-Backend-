import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Campaign from './models/Campaign.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundraisingnew')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get all main campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ parentCampaignId: null });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get campaign by ID
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sub-campaigns for a campaign
app.get('/api/campaigns/:id/sub-campaigns', async (req, res) => {
  try {
    const subCampaigns = await Campaign.find({ parentCampaignId: req.params.id });
    res.json(subCampaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete campaign
app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete all sub-campaigns if this is a main campaign
    if (!campaign.parentCampaignId) {
      await Campaign.deleteMany({ parentCampaignId: req.params.id });
    } else {
      // If this is a sub-campaign, update parent campaign amount
      const parentCampaign = await Campaign.findById(campaign.parentCampaignId);
      if (parentCampaign) {
        parentCampaign.currentAmount -= campaign.currentAmount;
        await parentCampaign.save();
      }
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Donate to campaign
app.post('/api/campaigns/:id/donate', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const amount = Number(req.body.amount);
    campaign.currentAmount += amount;
    await campaign.save();

    // If this is a sub-campaign, update parent campaign
    if (campaign.parentCampaignId) {
      const parentCampaign = await Campaign.findById(campaign.parentCampaignId);
      if (parentCampaign) {
        parentCampaign.currentAmount += amount;
        await parentCampaign.save();
      }
    }

    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});