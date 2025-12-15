using CampusSmartAPI.Models;
using CampusSmartAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CampusSmartAPI.Controllers
{
    /// <summary>
    /// 设备控制器
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceService _deviceService;
        
        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="deviceService">设备服务</param>
        public DeviceController(IDeviceService deviceService)
        {
            _deviceService = deviceService;
        }
        
        /// <summary>
        /// 获取所有设备
        /// </summary>
        /// <returns>设备列表</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Device>>> GetAllDevices()
        {
            var devices = await _deviceService.GetAllDevicesAsync();
            return Ok(devices);
        }
        
        /// <summary>
        /// 根据ID获取设备
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <returns>设备对象</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Device>> GetDeviceById(int id)
        {
            var device = await _deviceService.GetDeviceByIdAsync(id);
            if (device == null)
            {
                return NotFound();
            }
            return Ok(device);
        }
        
        /// <summary>
        /// 根据状态获取设备
        /// </summary>
        /// <param name="status">设备状态</param>
        /// <returns>设备列表</returns>
        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<Device>>> GetDevicesByStatus(string status)
        {
            var devices = await _deviceService.GetDevicesByStatusAsync(status);
            return Ok(devices);
        }
        
        /// <summary>
        /// 根据类型获取设备
        /// </summary>
        /// <param name="type">设备类型</param>
        /// <returns>设备列表</returns>
        [HttpGet("type/{type}")]
        public async Task<ActionResult<IEnumerable<Device>>> GetDevicesByType(string type)
        {
            var devices = await _deviceService.GetDevicesByTypeAsync(type);
            return Ok(devices);
        }
        
        /// <summary>
        /// 添加设备
        /// </summary>
        /// <param name="device">设备对象</param>
        /// <returns>添加的设备对象</returns>
        [HttpPost]
        public async Task<ActionResult<Device>> AddDevice([FromBody] Device device)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var addedDevice = await _deviceService.AddDeviceAsync(device);
            return CreatedAtAction(nameof(GetDeviceById), new { id = addedDevice.DeviceID }, addedDevice);
        }
        
        /// <summary>
        /// 更新设备
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <param name="device">设备对象</param>
        /// <returns>更新的设备对象</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<Device>> UpdateDevice(int id, [FromBody] Device device)
        {
            if (id != device.DeviceID)
            {
                return BadRequest("设备ID不匹配");
            }
            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var updatedDevice = await _deviceService.UpdateDeviceAsync(device);
            if (updatedDevice == null)
            {
                return NotFound();
            }
            
            return Ok(updatedDevice);
        }
        
        /// <summary>
        /// 删除设备
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <returns>是否删除成功</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<bool>> DeleteDevice(int id)
        {
            var result = await _deviceService.DeleteDeviceAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return Ok(result);
        }
        
        /// <summary>
        /// 更新设备状态
        /// </summary>
        /// <param name="id">设备ID</param>
        /// <param name="status">新状态</param>
        /// <returns>更新的设备对象</returns>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<Device>> UpdateDeviceStatus(int id, [FromBody] string status)
        {
            var updatedDevice = await _deviceService.UpdateDeviceStatusAsync(id, status);
            if (updatedDevice == null)
            {
                return NotFound();
            }
            return Ok(updatedDevice);
        }
    }
}