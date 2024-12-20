const logger = require('../utils/logger');
const Achievement = require('../models/Achievement');
const Player = require('../models/Player');

class RewardService {
    constructor() {
        this.ACHIEVEMENT_REWARDS = {
            kills: {
                10: 5,    // 5 tokens for 10 kills
                50: 15,   // 15 tokens for 50 kills
                100: 25,  // 25 tokens for 100 kills
                500: 50,  // 50 tokens for 500 kills
                1000: 100 // 100 tokens for 1000 kills
            },
            hits: {
                100: 10,   // 10 tokens for 100 hits
                500: 25,   // 25 tokens for 500 hits
                1000: 50,  // 50 tokens for 1000 hits
                5000: 100  // 100 tokens for 5000 hits
            },
            survivalTime: {
                3600: 10,   // 10 tokens for 1 hour
                18000: 25,  // 25 tokens for 5 hours
                86400: 100  // 100 tokens for 24 hours
            },
            accuracy: {
                50: 10,   // 10 tokens for 50% accuracy
                75: 25,   // 25 tokens for 75% accuracy
                90: 50,   // 50 tokens for 90% accuracy
                95: 100   // 100 tokens for 95% accuracy
            },
            drone: {
                100: 10,
                500: 50,
                1000: 100,
                5000: 500
            }
        };
    }

    async getPlayerAchievements(playerId) {
        try {
            const achievements = await Achievement.find({ playerId }).sort({ unlockedAt: -1 });
            return achievements.map(achievement => ({
                ...achievement.toObject(),
                reward: this.ACHIEVEMENT_REWARDS[achievement.type][achievement.milestone]
            }));
        } catch (error) {
            logger.error(`Error fetching achievements for player ${playerId}:`, error);
            throw error;
        }
    }

    async getAchievementConfig() {
        return {
            achievements: this.ACHIEVEMENT_REWARDS,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = new RewardService();