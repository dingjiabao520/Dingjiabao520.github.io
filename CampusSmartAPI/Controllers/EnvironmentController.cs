using CampusSmartAPI.Models;
using CampusSmartAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CampusSmartAPI.Controllers
{
    /// <summary>
    /// 环境数据控制器
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class EnvironmentController : ControllerBase
    {
        private readonly IEnvironmentService _environmentService;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="environmentService">环境数据服务</param>
        public EnvironmentController(IEnvironmentService environmentService)
        {
            _environmentService = environmentService;
        }
        
        /// <summary>
        /// 获取所有环境数据
        /// </summary>
        /// <returns>环境数据列表</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnvironmentData>>> GetAllEnvironmentData()
        {
            var data = await _environmentService.GetAllEnvironmentDataAsync();
            return Ok(data);
        }
        
        /// <summary>
        /// 根据设备ID获取环境数据
        /// </summary>
        /// <param name="deviceId">设备ID</param>
        /// <returns>环境数据列表</returns>
        [HttpGet("device/{deviceId}")]
        public async Task<ActionResult<IEnumerable<EnvironmentData>>> GetEnvironmentDataByDeviceId(int deviceId)
        {
            var data = await _environmentService.GetEnvironmentDataByDeviceIdAsync(deviceId);
            return Ok(data);
        }
        
        /// <summary>
        /// 根据时间范围获取环境数据
        /// </summary>
        /// <param name="startTime">开始时间</param>
        /// <param name="endTime">结束时间</param>
        /// <returns>环境数据列表</returns>
        [HttpGet("timerange")]
        public async Task<ActionResult<IEnumerable<EnvironmentData>>> GetEnvironmentDataByTimeRange(DateTime startTime, DateTime endTime)
        {
            var data = await _environmentService.GetEnvironmentDataByTimeRangeAsync(startTime, endTime);
            return Ok(data);
        }
        
        /// <summary>
        /// 获取设备最新环境数据
        /// </summary>
        /// <param name="deviceId">设备ID</param>
        /// <returns>最新环境数据</returns>
        [HttpGet("latest/{deviceId}")]
        public async Task<ActionResult<EnvironmentData>> GetLatestEnvironmentData(int deviceId)
        {
            var data = await _environmentService.GetLatestEnvironmentDataByDeviceIdAsync(deviceId);
            if (data == null)
            {
                return NotFound();
            }
            return Ok(data);
        }
        
        /// <summary>
        /// 添加环境数据
        /// </summary>
        /// <param name="environmentData">环境数据对象</param>
        /// <returns>添加的环境数据对象</returns>
        [HttpPost]
        public async Task<ActionResult<EnvironmentData>> AddEnvironmentData([FromBody] EnvironmentData environmentData)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var addedData = await _environmentService.AddEnvironmentDataAsync(environmentData);
            return CreatedAtAction(nameof(GetLatestEnvironmentData), new { deviceId = addedData.DeviceID }, addedData);
        }
        
        /// <summary>
        /// 批量添加环境数据
        /// </summary>
        /// <param name="environmentDataList">环境数据列表</param>
        /// <returns>添加的环境数据数量</returns>
        [HttpPost("batch")]
        public async Task<ActionResult<int>> AddEnvironmentDataBatch([FromBody] IEnumerable<EnvironmentData> environmentDataList)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var count = await _environmentService.AddEnvironmentDataRangeAsync(environmentDataList);
            return Ok(count);
        }
    }
}