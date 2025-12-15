using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 3D模型信息表 - 存储模型的基本信息
    /// </summary>
    public class ModelInfo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ModelID { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string ModelName { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Version { get; set; } // 模型版本
        
        public DateTime CreatedDate { get; set; } // 创建日期
        
        [MaxLength(200)]
        public string Copyright { get; set; } // 版权信息
        
        [MaxLength(50)]
        public string Schema { get; set; } // 模型格式
        
        [MaxLength(500)]
        public string Description { get; set; } // 模型描述
        
        [Required]
        [MaxLength(20)]
        public string ModelType { get; set; } // 模型类型（如：文科教学楼）
        
        // 导航属性
        public ICollection<ModelPart> ModelParts { get; set; }
        public ICollection<ModelData> ModelDatas { get; set; }
    }
}