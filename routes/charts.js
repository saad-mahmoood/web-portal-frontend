@@ .. @@
 // @desc    Get aggregated chart data for a hierarchy (region, area, field, well)
 // @route   GET /api/charts/hierarchy/:hierarchyId
 // @access  Private
 router.get('/hierarchy/:hierarchyId', protect, async (req, res) => {
   try {
-    const hierarchyId = parseInt(req.params.hierarchyId);
    const hierarchyId = req.params.hierarchyId;
    
    // Validate hierarchyId is a valid number
    if (!hierarchyId || isNaN(parseInt(hierarchyId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hierarchy ID provided'
      });
    }
    
    const parsedHierarchyId = parseInt(hierarchyId);
+    const hierarchyId = req.params.hierarchyId;
+    
+    // Validate hierarchyId is a valid number
+    if (!hierarchyId || isNaN(parseInt(hierarchyId))) {
+      return res.status(400).json({
+        success: false,
+        message: 'Invalid hierarchy ID provided'
+      });
+    }
+    
    const deviceId = req.params.deviceId;
    
    // Validate deviceId is a valid number
    if (!deviceId || isNaN(parseInt(deviceId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID provided'
      });
    }
    
    const parsedDeviceId = parseInt(deviceId);
     const timeRange = req.query.timeRange || 'day'; // hour, day, week, month
 
     // Check if hierarchy exists and user has access
-    const hierarchy = await Hierarchy.findById(hierarchyId);
    const hierarchy = await Hierarchy.findById(parsedHierarchyId);
    const device = await Device.findById(parsedDeviceId);
     if (!hierarchy) {
       return res.status(404).json({
         success: false,
    const chartData = await Device.getDeviceChartData(parsedDeviceId, timeRange);
    const latestData = await Device.getLatestDeviceData(parsedDeviceId);
     }
 
     // Check if user has access to this hierarchy (same company or admin)
     if (req.user.role !== 'admin' && hierarchy.company_id !== req.user.company_id) {
       return res.status(403).json({
         success: false,
         message: 'Access denied to this hierarchy'
       });
     }
 
     // Get aggregated chart data for this hierarchy and all its children
-    const chartData = await Device.getHierarchyChartData(hierarchyId, timeRange);
    const chartData = await Device.getHierarchyChartData(parsedHierarchyId, timeRange);
+    const chartData = await Device.getHierarchyChartData(parsedHierarchyId, timeRange);
 
     // Get devices under this hierarchy
     const database = require('../config/database');
     const devicesQuery = `
       WITH RECURSIVE hierarchy_cte AS (
         SELECT id FROM hierarchy WHERE id = $1
         UNION ALL
         SELECT h.id FROM hierarchy h JOIN hierarchy_cte c ON h.parent_id = c.id
       )
       SELECT d.*, dt.type_name as device_type_name, h.name as hierarchy_name,
              dl.data as latest_data, dl.updated_at as latest_data_time
       FROM device d
       JOIN device_type dt ON d.device_type_id = dt.id
       JOIN hierarchy_device hd ON d.id = hd.device_id
       JOIN hierarchy h ON hd.hierarchy_id = h.id
       LEFT JOIN device_latest dl ON d.id = dl.device_id
       WHERE hd.hierarchy_id IN (SELECT id FROM hierarchy_cte)
       ORDER BY d.serial_number
     `;
     
-    const devicesResult = await database.query(devicesQuery, [hierarchyId]);
+    const devicesResult = await database.query(devicesQuery, [parsedHierarchyId]);
     const devices = devicesResult.rows;
    const rawResult = await database.query(rawQuery, [parsedHierarchyId]);