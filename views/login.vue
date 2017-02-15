<template>
	<div class="login_page">
		<div class="login">
			<div class="login_alert">
				<el-alert :title="alertMessage" v-show="alertMessage" type="error"></el-alert>
			</div>
			<el-form :model="ruleForm2" :rules="rules2" ref="ruleForm2" class="demo-ruleForm">
				<el-form-item label="" prop="username">
					<el-input type="text" v-model="ruleForm2.username" placeholder="请输入用户名"></el-input>
				</el-form-item>
				<el-form-item label="" prop="password">
					<el-input type="password" v-model="ruleForm2.password" placeholder="请输入密码"></el-input>
				</el-form-item>
				<el-form-item label="" prop="code" class="code_input">
					<el-input type="text" v-model="ruleForm2.code" placeholder="请输入验证码"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="submitForm('ruleForm2')">提交</el-button>
				</el-form-item>
			</el-form>
		</div>
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
			var validatePass3 = (rule, value, callback) => {
				if(value === '') {
					callback(new Error('请输入验证码'));
				}else {
					callback();
				}
			};
			return {
				alertMessage:"",
				ruleForm2: {
					username: '',
					password: '',
					code:''
				},
				rules2: {
					username: [{
						validator: validatePass,
						trigger: 'blur'
					}],
					password: [{
						validator: validatePass2,
						trigger: 'blur'
					}],
					code:[{
						validator: validatePass3,
						trigger: 'blur'
					}]
				}
			};
		},
		mounted(){
			$(".login_page").height($(window).height());
			$(window).resize(function(){
				$(".login_page").height($(window).height());
			});
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
			}
		}
	})
</script>
<style>
	.login_page{
		/*background:-webkit-gradient(linear, 0% 0%, 0% 100%,from(#182545), to(#2b759c));*/
	}
	.login{
		position: absolute;
		width: 300px;
		height: 240px;
		left: 50%;
		top: 50%;
		margin-left: -150px;
		margin-top: -120px;
	}
	.login_alert{
		margin-bottom: 20px;
		height:30px;
	}
	/* 
	 * 修改element 样式
	 */
	.code_input .el-form-item__content{
		margin-right: 120px;
	}
	.el-button{
		width: 100%;
	}
</style>