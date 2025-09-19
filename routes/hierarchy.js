// @desc    Get hierarchy by ID
// @route   GET /api/hierarchy/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const hierarchyId = req.params.id;
    
    // Validate hierarchyId is a valid number
    if (!hierarchyId || isNaN(parseInt(hierarchyId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hierarchy ID provided'
      });
    }
    
    const hierarchy = await Hierarchy.findById(parseInt(hierarchyId));