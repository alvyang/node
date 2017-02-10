<template>
	<div class="login">
		<div class="login_alert">
			<el-alert :title="alertMessage" v-show="alertMessage" type="error"></el-alert>
		</div>
		<el-form :model="ruleForm2" :rules="rules2" ref="ruleForm2" label-width="100px" class="demo-ruleForm">
			<el-form-item label="用户名" prop="username">
				<el-input type="text" v-model="ruleForm2.username" auto-complete="off"></el-input>
			</el-form-item>
			<el-form-item label="密　码" prop="password">
				<el-input type="password" v-model="ruleForm2.password" auto-complete="off"></el-input>
			</el-form-item>
			<el-form-item>
				<el-button type="primary" @click="submitForm('ruleForm2')">提交</el-button>
				<el-button @click="resetForm('ruleForm2')">重置</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>
<script>
	import $ from "jquery";
	export default({
		data() {
			var validatePass = (rule, value, callback) => {
				if(value === '') {
					callback(new Error('请输入用户名'));
				} else {
					if(this.ruleForm2.password !== '') {
						this.$refs.ruleForm2.validateField('password');
					}
					callback();
				}
			};
			var validatePass2 = (rule, value, callback) => {
				if(value === '') {
					callback(new Error('请输入密码'));
				}else {
					callback();
				}
			};
			return {
				alertMessage:"",
				ruleForm2: {
					username: '',
					password: ''
				},
				rules2: {
					username: [{
						validator: validatePass,
						trigger: 'blur'
					}],
					password: [{
						validator: validatePass2,
						trigger: 'blur'
					}]
				}
			};
		},
		methods: {
			submitForm(formName) {
				var _self = this;
				this.$refs[formName].validate((valid) => {
					if(valid) {
						$.ajax({
							type:"post",
							url:"/login/login",
							data:_self.ruleForm2,
							success:function(res){
								if(res.code == "000000"){
									_self.$router.push({path:"/main"});
								}else{
									_self.alertMessage = res.message;
									setTimeout(function(){
										_self.alertMessage = "";
									},2000);
								}
						    }
						});
					} else {
						console.log('error submit!!');
						return false;
					}
				});
			},
			resetForm(formName) {
				this.$refs[formName].resetFields();
			}
		}
	})
</script>
<style>
	.login{
		background-color: #ffffff;
		position: absolute;
		width: 400px;
		height: 240px;
		left: 50%;
		top: 50%;
		margin-left: -200px;
		margin-top: -120px;
	}
	.login_alert{
		margin-bottom: 20px;
	}
</style>