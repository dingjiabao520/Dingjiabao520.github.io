using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 3D模型分块表 - 存储模型的各个分块信息
    /// </summary>
    public class ModelPart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PartID { get; set; }
        
        [Required]
        public int ModelID { get; set; } // 所属模型ID
        
        [Required]
        [MaxLength(200)]
        public string PartFileName { get; set; } // 分块文件名
        
        public int PartIndex { get; set; } // 分块索引
        
        [MaxLength(50)]
        public string PartType { get; set; } // 分块类型
        
        [MaxLength(500)]
        public string Description { get; set; } // 分块描述
        
        // 导航属性
        [ForeignKey("ModelID")]
        public ModelInfo Model { get; set; }
    }
}