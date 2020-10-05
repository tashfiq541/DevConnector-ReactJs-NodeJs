const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route        GET api/profile/me
//@description  Get current users profile
//@access       Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.json({ profile });
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server Error');
	}
});

//@route        POST api/profile
//@description  Create or update user profile
//@access       Private
router.post(
	'/',
	[
		auth,
		[check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty()]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			location,
			website,
			bio,
			skills,
			status,
			githubusername,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook
		} = req.body;

		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (location) profileFields.location = location;
		if (website) profileFields.website = website;
		if (bio) profileFields.bio = bio;
		if (githubusername) profileFields.githubusername = githubusername;
		if (status) profileFields.status = status;
		if (skills) profileFields.skills = skills.split(',').map((skill) => skill.trim());
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
				return res.json({ profile });
			}

			profile = new Profile(profileFields);
			await profile.save();
			res.json({ profile });
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server Error');
		}
	}
);

//@route        GET api/profile
//@description  Get all profiles
//@access       Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json({ profiles });
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server Error');
	}
});

//@route        GET api/profile/user/user_id
//@description  Get profile by user id
//@access       Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
		if (!profile) {
			return res.status(400).json({ msg: 'Ther is no profile for this user' });
		}
		res.json(profile);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		res.status(500).send('Server Error');
	}
});

//@route        DELETE api/profile
//@description  Delete profile, user, post
//@access       private
router.delete('/', auth, async (req, res) => {
	try {
		await Profile.findOneAndRemove({ user: req.user.id });
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: 'User deleted' });
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server Error');
	}
});

//@route        PUT api/profile/experience
//@description  Add profile experience
//@access       private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'from date is required').not().isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { title, company, location, from, to, current, description } = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);
			profile.save();
			res.json(profile);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server Error');
		}
	}
);

module.exports = router;
