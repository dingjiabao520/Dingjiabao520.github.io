using CampusSmartAPI.Data;
using CampusSmartAPI.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Text;

namespace CampusSmartAPI.Services
{
    /// <summary>
    /// 模型数据导入服务实现类
    /// </summary>
    public class ModelImportService : IModelImportService
    {
        private readonly CampusSmartDbContext _context;
        private string _importStatus = "未开始导入";
        
        public ModelImportService(CampusSmartDbContext context)
        {
            _context = context;
        }
        
        /// <inheritdoc/>
        public async Task<string> ImportModelFromJson(string filePath, string modelType)
        {
            try
            {
                _importStatus = "开始导入模型数据...";
                
                // 检查文件是否存在
                if (!File.Exists(filePath))
                {
                    _importStatus = "文件不存在";
                    return "错误：文件不存在";
                }
                
                _importStatus = "读取JSON文件...";
                // 读取JSON文件内容
                string jsonContent = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
                
                _importStatus = "解析JSON数据...";
                // 解析JSON数据
                var modelData = JsonConvert.DeserializeObject<ModelJsonData>(jsonContent);
                if (modelData == null)
                {
                    _importStatus = "JSON数据解析失败";
                    return "错误：JSON数据解析失败";
                }
                
                _importStatus = "保存模型基本信息...";
                // 保存模型基本信息
                var modelInfo = new ModelInfo
                {
                    ModelName = "文科教学楼", // 根据实际情况设置
                    Version = modelData.version,
                    CreatedDate = DateTime.Parse(modelData.created),
                    Copyright = modelData.copyright,
                    Schema = modelData.schema,
                    ModelType = modelType,
                    Description = $"{modelType} 3D模型",
                    ModelParts = new List<ModelPart>(),
                    ModelDatas = new List<ModelData>()
                };
                
                await _context.ModelInfos.AddAsync(modelInfo);
                await _context.SaveChangesAsync();
                
                _importStatus = "保存模型分块信息...";
                // 保存模型分块信息
                for (int i = 0; i < modelData.partFileNames.Length; i++)
                {
                    var part = new ModelPart
                    {
                        ModelID = modelInfo.ModelID,
                        PartFileName = modelData.partFileNames[i],
                        PartIndex = i,
                        PartType = "模型分块",
                        Description = $"{modelType} 第 {i+1} 个分块"
                    };
                    await _context.ModelParts.AddAsync(part);
                }
                await _context.SaveChangesAsync();
                
                _importStatus = "保存模型详细数据...";
                // 保存模型详细数据，包括externalIds、categories和types
                if (modelData.db != null)
                {
                    // 保存externalIds
                    if (modelData.db.externalIds != null)
                    {
                        for (int i = 0; i < modelData.db.externalIds.Length; i++)
                        {
                            var externalId = modelData.db.externalIds[i];
                            if (!string.IsNullOrEmpty(externalId))
                            {
                                var modelDataItem = new ModelData
                                {
                                    ModelID = modelInfo.ModelID,
                                    DataType = "ExternalId",
                                    DataKey = i.ToString(),
                                    ExternalId = externalId
                                };
                                await _context.ModelDatas.AddAsync(modelDataItem);
                            }
                        }
                    }
                    
                    // 保存categories
                    if (modelData.db.categories != null)
                    {
                        for (int i = 0; i < modelData.db.categories.Length; i++)
                        {
                            var category = modelData.db.categories[i]?.ToString();
                            if (!string.IsNullOrEmpty(category))
                            {
                                var modelDataItem = new ModelData
                                {
                                    ModelID = modelInfo.ModelID,
                                    DataType = "Category",
                                    DataKey = i.ToString(),
                                    ExternalId = category
                                };
                                await _context.ModelDatas.AddAsync(modelDataItem);
                            }
                        }
                    }
                    
                    // 保存types
                    if (modelData.db.types != null)
                    {
                        for (int i = 0; i < modelData.db.types.Length; i++)
                        {
                            var type = modelData.db.types[i]?.ToString();
                            if (!string.IsNullOrEmpty(type))
                            {
                                var modelDataItem = new ModelData
                                {
                                    ModelID = modelInfo.ModelID,
                                    DataType = "Type",
                                    DataKey = i.ToString(),
                                    ExternalId = type
                                };
                                await _context.ModelDatas.AddAsync(modelDataItem);
                            }
                        }
                    }
                    
                    await _context.SaveChangesAsync();
                }
                
                _importStatus = "导入完成";
                return "成功：模型数据导入完成";
            }
            catch (Exception ex)
            {
                _importStatus = $"导入失败：{ex.Message}";
                return $"错误：{ex.Message}";
            }
        }
        
        /// <inheritdoc/>
        public string GetImportStatus()
        {
            return _importStatus;
        }
    }
    
    /// <summary>
    /// 模型JSON数据结构
    /// </summary>
    public class ModelJsonData
    {
        public string version { get; set; }
        public string created { get; set; }
        public string copyright { get; set; }
        public string schema { get; set; }
        public string[] partFileNames { get; set; }
        public ModelDbData db { get; set; }
    }
    
    /// <summary>
    /// 模型数据库数据结构
    /// </summary>
    public class ModelDbData
    {
        public int rootDbId { get; set; }
        public string[] externalIds { get; set; }
        public int[] parentIds { get; set; }
        public string[] names { get; set; }
        public string[] categories { get; set; }
        public string[] types { get; set; }
    }
}