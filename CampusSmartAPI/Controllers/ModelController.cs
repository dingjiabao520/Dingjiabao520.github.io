using CampusSmartAPI.Data;
using CampusSmartAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CampusSmartAPI.Controllers
{
    /// <summary>
    /// 3D模型控制器
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ModelController : ControllerBase
    {
        private readonly IModelImportService _modelImportService;
        private readonly CampusSmartDbContext _context;
        private readonly ILogger<ModelController> _logger;
        
        public ModelController(IModelImportService modelImportService, CampusSmartDbContext context, ILogger<ModelController> logger)
        {
            _modelImportService = modelImportService;
            _context = context;
            _logger = logger;
        }
        
        /// <summary>
        /// 导入模型数据
        /// </summary>
        /// <param name="filePath">JSON文件路径</param>
        /// <param name="modelType">模型类型</param>
        /// <returns>导入结果</returns>
        [HttpPost("import")]
        public async Task<IActionResult> ImportModel([FromQuery] string filePath, [FromQuery] string modelType)
        {
            try
            {
                _logger.LogInformation($"收到模型导入请求: filePath={filePath}, modelType={modelType}");
                
                if (string.IsNullOrEmpty(filePath))
                {
                    _logger.LogWarning("模型导入请求失败: 文件路径不能为空");
                    return BadRequest("文件路径不能为空");
                }
                
                if (string.IsNullOrEmpty(modelType))
                {
                    _logger.LogWarning("模型导入请求失败: 模型类型不能为空");
                    return BadRequest("模型类型不能为空");
                }
                
                _logger.LogInformation($"开始导入模型数据: filePath={filePath}, modelType={modelType}");
                var result = await _modelImportService.ImportModelFromJson(filePath, modelType);
                _logger.LogInformation($"模型导入完成: {result}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"模型导入出错: filePath={filePath}, modelType={modelType}");
                return StatusCode(500, $"导入出错：{ex.Message}");
            }
        }
        
        /// <summary>
        /// 获取导入状态
        /// </summary>
        /// <returns>导入状态</returns>
        [HttpGet("import-status")]
        public IActionResult GetImportStatus()
        {
            var status = _modelImportService.GetImportStatus();
            return Ok(new { status });
        }
        
        /// <summary>
        /// 获取模型详细数据
        /// </summary>
        /// <returns>模型详细数据</returns>
        [HttpGet("building-data")]
        public IActionResult GetBuildingData()
        {
            try
            {
                _logger.LogInformation("开始获取模型数据...");
                
                // 获取模型基本信息
                var modelInfo = _context.ModelInfos
                    .FirstOrDefault(m => m.ModelName == "文科教学楼");
                
                if (modelInfo == null)
                {
                    _logger.LogWarning("未找到文科教学楼的模型数据");
                    return NotFound("未找到文科教学楼的模型数据");
                }
                
                _logger.LogInformation($"找到模型数据: ModelID={modelInfo.ModelID}, ModelName={modelInfo.ModelName}");
                
                // 获取关联的ModelParts
                var modelParts = _context.ModelParts
                    .Where(p => p.ModelID == modelInfo.ModelID)
                    .Select(p => new {
                        p.PartID,
                        p.PartFileName,
                        p.PartIndex,
                        p.PartType,
                        p.Description
                    })
                    .ToList();
                
                // 获取关联的ModelDatas（包含externalIds）
                var modelDatas = _context.ModelDatas
                    .Where(d => d.ModelID == modelInfo.ModelID)
                    .Select(d => new {
                        d.DataID,
                        d.DataType,
                        d.DataKey,
                        d.ExternalId
                    })
                    .ToList();
                
                // 返回完整信息，使用匿名对象避免循环引用
                var result = new
                {
                    modelInfo.ModelID,
                    modelInfo.ModelName,
                    modelInfo.Version,
                    modelInfo.CreatedDate,
                    modelInfo.Copyright,
                    modelInfo.Schema,
                    modelInfo.ModelType,
                    modelInfo.Description,
                    ModelParts = modelParts,
                    ModelDatas = modelDatas
                };
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "获取模型数据出错: {Message}", ex.Message);
                return StatusCode(500, new { error = "获取模型数据失败", message = ex.Message });
            }
        }
    }
}