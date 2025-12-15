using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusSmartAPI.Models
{
    /// <summary>
    /// 3D模型数据表 - 存储模型的详细数据信息
    /// </summary>
    public class ModelData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DataID { get; set; }
        
        [Required]
        public int ModelID { get; set; } // 所属模型ID
        
        [Required]
        public string DataType { get; set; } // 数据类型
        
        [Required]
        public string DataKey { get; set; } // 数据键
        
        [MaxLength(100)]
        public string ExternalId { get; set; } // 外部ID
        
        // 导航属性
        [ForeignKey("ModelID")]
        public ModelInfo Model { get; set; }
    }
}